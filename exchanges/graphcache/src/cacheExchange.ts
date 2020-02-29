import { IntrospectionQuery } from 'graphql';

import {
  Exchange,
  formatDocument,
  Operation,
  OperationResult,
  RequestPolicy,
  CacheOutcome,
} from '@urql/core';

import {
  filter,
  map,
  merge,
  pipe,
  share,
  tap,
  fromPromise,
  fromArray,
  buffer,
  take,
  mergeMap,
  concat,
  empty,
  Source,
} from 'wonka';

import { query, write, writeOptimistic } from './operations';
import { hydrateData, hasOptimisticKey, mergeAndDeleteOptimisticLayer } from './store/data';
import { makeDict } from './helpers/dict';
import { Store, clearOptimistic } from './store';

import {
  UpdatesConfig,
  ResolverConfig,
  OptimisticMutationConfig,
  KeyingConfig,
  StorageAdapter,
} from './types';

type OperationResultWithMeta = OperationResult & {
  outcome: CacheOutcome;
};

type OperationMap = Map<number, Operation>;

interface DependentOperations {
  [key: string]: number[];
}

// Returns the given operation result with added cacheOutcome meta field
const addCacheOutcome = (op: Operation, outcome: CacheOutcome): Operation => ({
  ...op,
  context: {
    ...op.context,
    meta: {
      ...op.context.meta,
      cacheOutcome: outcome,
    },
  },
});

// Returns the given operation with added __typename fields on its query
const addTypeNames = (op: Operation): Operation => ({
  ...op,
  query: formatDocument(op.query),
});

// Retrieves the requestPolicy from an operation
const getRequestPolicy = (op: Operation) => op.context.requestPolicy;

// Returns whether an operation is a query
const isQueryOperation = (op: Operation): boolean =>
  op.operationName === 'query';

// Returns whether an operation is a mutation
const isMutationOperation = (op: Operation): boolean =>
  op.operationName === 'mutation';

// Returns whether an operation can potentially be read from cache
const isCacheableQuery = (op: Operation): boolean => {
  return isQueryOperation(op) && getRequestPolicy(op) !== 'network-only';
};

// Returns whether an operation potentially triggers an optimistic update
const isOptimisticMutation = (op: Operation): boolean => {
  return isMutationOperation(op) && getRequestPolicy(op) !== 'network-only';
};

// Copy an operation and change the requestPolicy to skip the cache
const toRequestPolicy = (
  operation: Operation,
  requestPolicy: RequestPolicy
): Operation => ({
  ...operation,
  context: {
    ...operation.context,
    requestPolicy,
  },
});

export interface CacheExchangeOpts {
  updates?: Partial<UpdatesConfig>;
  resolvers?: ResolverConfig;
  optimistic?: OptimisticMutationConfig;
  keys?: KeyingConfig;
  schema?: IntrospectionQuery;
  storage?: StorageAdapter;
}

export const cacheExchange = (opts?: CacheExchangeOpts): Exchange => ({
  forward,
  client,
}) => {
  if (!opts) opts = {};

  const store = new Store(
    opts.schema,
    opts.resolvers,
    opts.updates,
    opts.optimistic,
    opts.keys
  );

  let hydration: void | Promise<void>;
  if (opts.storage) {
    const storage = opts.storage;
    hydration = storage.read().then(entries => {
      hydrateData(store.data, storage, entries);
    });
  }

  const optimisticKeysToDependencies = new Map<number, Set<string>>();
  const ops: OperationMap = new Map();
  const deps: DependentOperations = makeDict();
  const inFlightKeys: Set<number> = new Set();

  const collectPendingOperations = (
    pendingOperations: Set<number>,
    dependencies: void | Set<string>
  ) => {
    if (dependencies !== undefined) {
      // Collect operations that will be updated due to cache changes
      dependencies.forEach(dep => {
        const keys = deps[dep];
        if (keys !== undefined) {
          deps[dep] = [];
          for (let i = 0, l = keys.length; i < l; i++) {
            pendingOperations.add(keys[i]);
          }
        }
      });
    }
  };

  const executePendingOperations = (
    operation: Operation,
    pendingOperations: Set<number>
  ) => {
    // Reexecute collected operations and delete them from the mapping
    pendingOperations.forEach(key => {
      if (key !== operation.key) {
        const op = ops.get(key);
        if (op !== undefined) {
          ops.delete(key);
          client.reexecuteOperation(toRequestPolicy(op, 'cache-first'));
        }
      }
    });
  };

  // This executes an optimistic update for mutations and registers it if necessary
  const optimisticUpdate = (operation: Operation) => {
    if (isOptimisticMutation(operation)) {
      const { key } = operation;
      const { dependencies } = writeOptimistic(store, operation, key);
      if (dependencies.size !== 0) {
        optimisticKeysToDependencies.set(key, dependencies);
        const pendingOperations = new Set<number>();
        collectPendingOperations(pendingOperations, dependencies);
        executePendingOperations(operation, pendingOperations);
      }
    }
  };

  // This updates the known dependencies for the passed operation
  const updateDependencies = (op: Operation, dependencies: Set<string>) => {
    dependencies.forEach(dep => {
      const keys = deps[dep] || (deps[dep] = []);
      keys.push(op.key);

      if (!ops.has(op.key)) {
        ops.set(
          op.key,
          getRequestPolicy(op) === 'network-only'
            ? toRequestPolicy(op, 'cache-and-network')
            : op
        );
      }
    });
  };

  // Retrieves a query result from cache and adds an `isComplete` hint
  // This hint indicates whether the result is "complete" or not
  const operationResultFromCache = (
    operation: Operation
  ): OperationResultWithMeta => {
    const { data, dependencies, partial } = query(store, operation);
    let cacheOutcome: CacheOutcome;

    if (data === null) {
      cacheOutcome = 'miss';
    } else {
      updateDependencies(operation, dependencies);
      cacheOutcome =
        !partial || getRequestPolicy(operation) === 'cache-only'
          ? 'hit'
          : 'partial';
    }

    return {
      outcome: cacheOutcome,
      operation,
      data,
    };
  };

  // Take any OperationResult and update the cache with it
  const updateCacheWithResult = (result: OperationResult): OperationResult => {
    const { operation, error, extensions } = result;
    const isQuery = isQueryOperation(operation);
    let { data } = result;

    // Clear old optimistic values from the store
    const { key } = operation;
    const pendingOperations = new Set<number>();
    collectPendingOperations(
      pendingOperations,
      optimisticKeysToDependencies.get(key)
    );
    optimisticKeysToDependencies.delete(key);
    clearOptimistic(store.data, key);

    let writeDependencies: Set<string> | void;
    let queryDependencies: Set<string> | void;
    if (data !== null && data !== undefined) {
      /**
       * Q1 - Q2 (operation series)
       *
       * When Q2 arrives first in this dispatch series we can't assume Q1
       * arriving won't goof up the data in our cache. That's why we'll write
       * this to an optimistic layer which we'll merge into the main data
       * after Q1 has arrived.
       */
      if (isQuery) {
        const inFlight: number[] = [...inFlightKeys];
        let index = inFlight.indexOf(result.operation.key);
        // An index of -1 should not be possible here but we should verify it.
        if (index === 0) {
          writeDependencies = write(store, operation, data).dependencies;
          inFlightKeys.delete(operation.key);
          if (hasOptimisticKey(store.data.records, operation.key)) clearOptimistic(store.data, operation.key);

          for (index += 1; index < inFlightKeys.size; index++) {
            if (hasOptimisticKey(store.data.records, inFlight[index])) {
              mergeAndDeleteOptimisticLayer(store.data, inFlight[index]);
              inFlightKeys.delete(inFlight[index]);
            }
          }
        } else {
          if (inFlight.every((key, i) => i >= index || hasOptimisticKey(store.data.records, key))) {
            // When every query before the one arriving has completed we need to squash the optimistic layers
            // into our main datasource.
            for (index -= 1; index > -1; index--) {
              mergeAndDeleteOptimisticLayer(store.data, operation.key);
              inFlightKeys.delete(inFlight[index]);
            }
          } else {
            // If this is not the case we need to add an additional optimistic layer to our cache.
            writeDependencies = write(store, operation, data, operation.key).dependencies;
          }
        }
      } else {
        // In case of mutations/subscriptions we just write since these should be idempotent
        // due the nature of the operation.
        writeDependencies = write(store, operation, data).dependencies;
      }

      if (isQuery) {
        const queryResult = query(store, operation);
        data = queryResult.data;
        queryDependencies = queryResult.dependencies;
      } else {
        data = query(store, operation, data).data;
      }
    }

    // Collect all write dependencies and query dependencies for queries
    collectPendingOperations(pendingOperations, writeDependencies);
    if (isQuery) {
      collectPendingOperations(pendingOperations, queryDependencies);
    }

    // Execute all pending operations related to changed dependencies
    executePendingOperations(result.operation, pendingOperations);

    // Update this operation's dependencies if it's a query
    if (isQuery && queryDependencies !== undefined) {
      updateDependencies(result.operation, queryDependencies);
    }

    return { data, error, extensions, operation };
  };

  return ops$ => {
    const sharedOps$ = pipe(ops$, share);

    // Buffer operations while waiting on hydration to finish
    // If no hydration takes place we replace this stream with an empty one
    const bufferedOps$ = hydration
      ? pipe(
          sharedOps$,
          buffer(fromPromise(hydration)),
          take(1),
          mergeMap(fromArray)
        )
      : (empty as Source<Operation>);

    const inputOps$ = pipe(
      concat([bufferedOps$, sharedOps$]),
      tap(op => {
        if (op.operationName === 'query') inFlightKeys.add(op.key);
        if (op.operationName === 'teardown' && inFlightKeys.has(op.key)) inFlightKeys.delete(op.key);
      }),
      map(addTypeNames),
      tap(optimisticUpdate),
      share
    );

    // Filter by operations that are cacheable and attempt to query them from the cache
    const cache$ = pipe(
      inputOps$,
      filter(op => isCacheableQuery(op)),
      map(operationResultFromCache),
      share
    );

    // Rebound operations that are incomplete, i.e. couldn't be queried just from the cache
    const cacheOps$ = pipe(
      cache$,
      filter(res => res.outcome === 'miss'),
      map(res => addCacheOutcome(res.operation, res.outcome)),
    );

    // Resolve OperationResults that the cache was able to assemble completely and trigger
    // a network request if the current operation's policy is cache-and-network
    const cacheResult$ = pipe(
      cache$,
      filter(res => res.outcome !== 'miss'),
      map(
        (res: OperationResultWithMeta): OperationResult => {
          const { operation, outcome } = res;
          const policy = getRequestPolicy(operation);
          const result: OperationResult = {
            operation: addCacheOutcome(operation, outcome),
            data: res.data,
            error: res.error,
            extensions: res.extensions,
          };

          if (
            policy === 'cache-and-network' ||
            (policy === 'cache-first' && outcome === 'partial')
          ) {
            result.stale = true;
            client.reexecuteOperation(
              toRequestPolicy(operation, 'network-only')
            );
          }

          return result;
        }
      )
    );

    // Forward operations that aren't cacheable and rebound operations
    // Also update the cache with any network results
    const result$ = pipe(
      merge([
        pipe(
          inputOps$,
          filter(op => !isCacheableQuery(op))
        ),
        cacheOps$,
      ]),
      filter(op => op.context.requestPolicy !== 'cache-only'),
      forward,
      map(updateCacheWithResult)
    );

    return merge([result$, cacheResult$]);
  };
};

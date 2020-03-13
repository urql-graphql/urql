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
import { hydrateData } from './store/data';
import { makeDict } from './helpers/dict';
import { Store, noopDataState, reserveLayer } from './store';

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
    hydration = opts.storage.read().then(entries => {
      hydrateData(store.data, opts!.storage!, entries);
    });
  }

  const optimisticKeysToDependencies = new Map<number, Set<string>>();
  const ops: OperationMap = new Map();
  const deps: DependentOperations = makeDict();

  const collectPendingOperations = (
    pendingOperations: Set<number>,
    dependencies: void | Set<string>
  ) => {
    if (dependencies) {
      // Collect operations that will be updated due to cache changes
      dependencies.forEach(dep => {
        const keys = deps[dep];
        if (keys) {
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
        if (op) {
          ops.delete(key);
          client.reexecuteOperation(toRequestPolicy(op, 'cache-first'));
        }
      }
    });
  };

  // This registers queries with the data layer to ensure commutativity
  const prepareCacheForResult = (operation: Operation) => {
    if (operation.operationName === 'query') {
      reserveLayer(store.data, operation.key);
    } else if (operation.operationName === 'teardown') {
      noopDataState(store.data, operation.key);
    }
  };

  // This executes an optimistic update for mutations and registers it if necessary
  const optimisticUpdate = (operation: Operation) => {
    const { key } = operation;
    if (
      operation.operationName === 'mutation' &&
      operation.context.requestPolicy !== 'network-only'
    ) {
      const { dependencies } = writeOptimistic(store, operation, key);
      if (dependencies.size !== 0) {
        optimisticKeysToDependencies.set(key, dependencies);
        const pendingOperations = new Set<number>();
        collectPendingOperations(pendingOperations, dependencies);
        executePendingOperations(operation, pendingOperations);
      }
    } else {
      noopDataState(store.data, key, true);
    }
  };

  // This updates the known dependencies for the passed operation
  const updateDependencies = (op: Operation, dependencies: Set<string>) => {
    dependencies.forEach(dep => {
      (deps[dep] || (deps[dep] = [])).push(op.key);

      if (!ops.has(op.key)) {
        ops.set(
          op.key,
          op.context.requestPolicy === 'network-only'
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
    const res = query(store, operation);
    const cacheOutcome: CacheOutcome = res.data
      ? !res.partial || operation.context.requestPolicy === 'cache-only'
        ? 'hit'
        : 'partial'
      : 'miss';

    if (res.data) {
      updateDependencies(operation, res.dependencies);
    }

    return {
      outcome: cacheOutcome,
      operation,
      data: res.data,
    };
  };

  // Take any OperationResult and update the cache with it
  const updateCacheWithResult = (result: OperationResult): OperationResult => {
    const { operation, error, extensions } = result;

    // Clear old optimistic values from the store
    const { key } = operation;
    const pendingOperations = new Set<number>();

    if (operation.operationName === 'mutation') {
      // Collect previous dependencies that have been written for optimistic updates
      collectPendingOperations(
        pendingOperations,
        optimisticKeysToDependencies.get(key)
      );
      optimisticKeysToDependencies.delete(key);
    } else if (operation.operationName === 'subscription') {
      // If we're writing a subscription, we ad-hoc reserve a layer
      reserveLayer(store.data, operation.key);
    }

    let queryDependencies: Set<string> | void;
    if (result.data) {
      // Write the result to cache and collect all dependencies that need to be
      // updated
      const writeDependencies = write(store, operation, result.data, key)
        .dependencies;
      collectPendingOperations(pendingOperations, writeDependencies);

      const queryResult = query(store, operation, result.data);
      result.data = queryResult.data;
      if (operation.operationName === 'query') {
        // Collect the query's dependencies for future pending operation updates
        queryDependencies = queryResult.dependencies;
        collectPendingOperations(pendingOperations, queryDependencies);
      }
    } else {
      noopDataState(store.data, operation.key);
    }

    // Execute all pending operations related to changed dependencies
    executePendingOperations(result.operation, pendingOperations);
    // Update this operation's dependencies if it's a query
    if (queryDependencies) {
      updateDependencies(result.operation, queryDependencies);
    }

    return { data: result.data, error, extensions, operation };
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
      // Returns the given operation with added __typename fields on its query
      map(op => ({
        ...op,
        query: formatDocument(op.query),
      })),
      tap(optimisticUpdate),
      share
    );

    // Filter by operations that are cacheable and attempt to query them from the cache
    const cache$ = pipe(
      inputOps$,
      filter(
        op =>
          op.operationName === 'query' &&
          op.context.requestPolicy !== 'network-only'
      ),
      map(operationResultFromCache),
      share
    );

    // Rebound operations that are incomplete, i.e. couldn't be queried just from the cache
    const cacheOps$ = pipe(
      cache$,
      filter(res => res.outcome === 'miss'),
      map(res => addCacheOutcome(res.operation, 'miss'))
    );

    // Resolve OperationResults that the cache was able to assemble completely and trigger
    // a network request if the current operation's policy is cache-and-network
    const cacheResult$ = pipe(
      cache$,
      filter(res => res.outcome !== 'miss'),
      map(
        (res: OperationResultWithMeta): OperationResult => {
          const { operation, outcome } = res;
          const result: OperationResult = {
            operation: addCacheOutcome(operation, outcome),
            data: res.data,
            error: res.error,
            extensions: res.extensions,
          };

          if (
            operation.context.requestPolicy === 'cache-and-network' ||
            (operation.context.requestPolicy === 'cache-first' &&
              outcome === 'partial')
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
          filter(
            op =>
              !(
                op.operationName === 'query' &&
                op.context.requestPolicy !== 'network-only'
              )
          )
        ),
        cacheOps$,
      ]),
      filter(op => op.context.requestPolicy !== 'cache-only'),
      tap(prepareCacheForResult),
      forward,
      map(updateCacheWithResult)
    );

    return merge([result$, cacheResult$]);
  };
};

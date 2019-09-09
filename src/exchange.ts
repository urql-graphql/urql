import {
  Exchange,
  formatDocument,
  Operation,
  OperationResult,
  RequestPolicy,
  CacheOutcome,
} from 'urql';

import { filter, map, merge, pipe, share, tap } from 'wonka';
import { query, write, writeOptimistic } from './operations';
import { SchemaPredicates } from './ast/schemaPredicates';
import { Store } from './store';

import {
  UpdatesConfig,
  ResolverConfig,
  OptimisticMutationConfig,
  KeyingConfig,
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
  const policy = getRequestPolicy(op);
  return isQueryOperation(op) && policy !== 'network-only';
};

// Returns whether an operation potentially triggers an optimistic update
const isOptimisticMutation = (op: Operation): boolean => {
  const policy = getRequestPolicy(op);
  return isMutationOperation(op) && policy !== 'network-only';
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
  schema?: object;
}

export const cacheExchange = (opts?: CacheExchangeOpts): Exchange => ({
  forward,
  client,
}) => {
  if (!opts) opts = {};

  const store = new Store(
    opts.schema ? new SchemaPredicates(opts.schema) : undefined,
    opts.resolvers,
    opts.updates,
    opts.optimistic,
    opts.keys
  );

  const optimisticKeys = new Set();
  const ops: OperationMap = new Map();
  const deps = Object.create(null) as DependentOperations;

  // This accepts an array of dependencies and reexecutes all known operations
  // against the mapping of dependencies to operations
  // The passed triggerOp is ignored however
  const processDependencies = (
    triggerOp: Operation,
    dependencies: Set<string>
  ) => {
    const pendingOperations = new Set<number>();

    // Collect operations that will be updated due to cache changes
    dependencies.forEach(dep => {
      const keys = deps[dep];
      if (keys !== undefined) {
        deps[dep] = [];
        keys.forEach(key => pendingOperations.add(key));
      }
    });

    // Reexecute collected operations and delete them from the mapping
    pendingOperations.forEach(key => {
      if (key !== triggerOp.key) {
        const op = ops.get(key);
        if (op !== undefined) {
          ops.delete(key);
          client.reexecuteOperation(op);
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
        optimisticKeys.add(key);
        processDependencies(operation, dependencies);
      }
    }
  };

  // This updates the known dependencies for the passed operation
  const updateDependencies = (op: Operation, dependencies: Set<string>) => {
    dependencies.forEach(dep => {
      const keys = deps[dep] || (deps[dep] = []);
      keys.push(op.key);

      if (!ops.has(op.key)) {
        const isNetworkOnly = op.context.requestPolicy === 'network-only';
        ops.set(
          op.key,
          isNetworkOnly ? toRequestPolicy(op, 'cache-and-network') : op
        );
      }
    });
  };

  // Retrieves a query result from cache and adds an `isComplete` hint
  // This hint indicates whether the result is "complete" or not
  const operationResultFromCache = (
    operation: Operation
  ): OperationResultWithMeta => {
    const policy = getRequestPolicy(operation);
    const { data, dependencies, partial } = query(store, operation);
    let cacheOutcome: CacheOutcome;

    if (data === null) {
      cacheOutcome = 'miss';
    } else {
      updateDependencies(operation, dependencies);
      cacheOutcome = !partial || policy === 'cache-only' ? 'hit' : 'partial';
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
    if (optimisticKeys.has(key)) {
      optimisticKeys.delete(key);
      store.clearOptimistic(key);
    }

    let writeDependencies, queryDependencies;
    if (data !== null && data !== undefined) {
      writeDependencies = write(store, operation, data).dependencies;

      if (isQuery) {
        const queryResult = query(store, operation);
        data = queryResult.data;
        queryDependencies = queryResult.dependencies;
      } else {
        data = query(store, operation, data).data;
      }
    }

    if (writeDependencies !== undefined) {
      // Update operations that depend on the updated data (except the current one)
      processDependencies(result.operation, writeDependencies);
    }

    // Update this operation's dependencies if it's a query
    if (isQuery && queryDependencies !== undefined) {
      updateDependencies(result.operation, queryDependencies);
    }

    return { data, error, extensions, operation };
  };

  return ops$ => {
    const sharedOps$ = pipe(
      ops$,
      map(addTypeNames),
      tap(optimisticUpdate),
      share
    );

    // Filter by operations that are cacheable and attempt to query them from the cache
    const cache$ = pipe(
      sharedOps$,
      filter(op => isCacheableQuery(op)),
      map(operationResultFromCache),
      share
    );

    // Rebound operations that are incomplete, i.e. couldn't be queried just from the cache
    const cacheOps$ = pipe(
      cache$,
      filter(res => res.outcome === 'miss'),
      map(res => addCacheOutcome(res.operation, res.outcome))
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
          if (
            policy === 'cache-and-network' ||
            (policy === 'cache-first' && outcome === 'partial')
          ) {
            const networkOnly = toRequestPolicy(operation, 'network-only');
            client.reexecuteOperation(networkOnly);
          }

          return {
            operation: addCacheOutcome(operation, outcome),
            data: res.data,
            error: res.error,
            extensions: res.extensions,
          };
        }
      )
    );

    // Forward operations that aren't cacheable and rebound operations
    // Also update the cache with any network results
    const result$ = pipe(
      forward(
        merge([
          pipe(
            sharedOps$,
            filter(op => !isCacheableQuery(op))
          ),
          cacheOps$,
        ])
      ),
      map(updateCacheWithResult)
    );

    return merge([result$, cacheResult$]);
  };
};

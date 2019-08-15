import {
  Exchange,
  formatDocument,
  Operation,
  OperationResult,
  RequestPolicy,
} from 'urql';

import {
  unstable_LowPriority as SchedulerLowPriority,
  unstable_scheduleCallback as scheduleCallback,
} from 'scheduler';

import { filter, map, merge, pipe, share, tap } from 'wonka';

import { query, write, gc } from './operations';
import { Store } from './store';
import { Completeness, UpdatesConfig, ResolverConfig } from './types';

type OperationResultWithMeta = OperationResult & {
  completeness: Completeness;
};

type OperationMap = Map<number, Operation>;

interface DependentOperations {
  [key: string]: number[];
}

// Returns the given operation with added __typename fields on its query
const addTypeNames = (op: Operation): Operation => ({
  ...op,
  query: formatDocument(op.query),
});

// Retrieves the requestPolicy from an operation
const getRequestPolicy = (op: Operation) => op.context.requestPolicy;

// Returns whether an operation is a query
const isQueryOperation = (op: Operation): boolean => {
  return op.operationName === 'query';
};

// Returns whether an operation is handled by this exchange
const isCacheableQuery = (op: Operation): boolean => {
  const policy = getRequestPolicy(op);
  return (
    isQueryOperation(op) &&
    (policy === 'cache-and-network' ||
      policy === 'cache-first' ||
      policy === 'cache-only')
  );
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
  updates?: UpdatesConfig;
  resolvers?: ResolverConfig;
}

export const cacheExchange = (opts: CacheExchangeOpts): Exchange => ({
  forward,
  client,
}) => {
  let gcScheduled = false;

  const store = new Store(opts.resolvers, opts.updates);
  const ops: OperationMap = new Map();
  const deps = Object.create(null) as DependentOperations;

  // This triggers a garbage collection run on the store's data
  const gcStore = () => {
    if (gcScheduled) {
      gcScheduled = false;
      gc(store);
    }
  };

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
        const op = ops.get(key) as Operation;
        ops.delete(key);
        client.reexecuteOperation(op);
      }
    });
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
    const res = query(store, operation);
    const isComplete = policy === 'cache-only' || res.completeness === 'FULL';
    if (isComplete) {
      updateDependencies(operation, res.dependencies);
    }

    return {
      operation,
      completeness: isComplete ? 'FULL' : 'EMPTY',
      data: res.data,
    };
  };

  // Take any OperationResult and update the cache with it
  const updateCacheWithResult = ({
    error,
    data,
    operation,
  }: OperationResult) => {
    if (
      (error === undefined || error.networkError === undefined) &&
      data !== null &&
      data !== undefined
    ) {
      const { dependencies } = write(store, operation, data);

      // Update operations that depend on the updated data (except the current one)
      processDependencies(operation, dependencies);

      // Update this operation's dependencies if it's a query
      if (isQueryOperation(operation)) {
        updateDependencies(operation, dependencies);
      }

      if (!gcScheduled) {
        gcScheduled = true;
        scheduleCallback(SchedulerLowPriority, gcStore);
      }
    }
  };

  return ops$ => {
    const sharedOps$ = pipe(
      ops$,
      map(addTypeNames),
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
      filter(res => res.completeness !== 'FULL'),
      map(res => res.operation)
    );

    // Resolve OperationResults that the cache was able to assemble completely and trigger
    // a network request if the current operation's policy is cache-and-network
    const cacheResult$ = pipe(
      cache$,
      filter(res => res.completeness === 'FULL'),
      tap(({ operation }) => {
        const policy = getRequestPolicy(operation);
        if (policy === 'cache-and-network') {
          const networkOnly = toRequestPolicy(operation, 'network-only');
          client.reexecuteOperation(networkOnly);
        }
      })
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
      tap(updateCacheWithResult)
    );

    return merge([result$, cacheResult$]);
  };
};

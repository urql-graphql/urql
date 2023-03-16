import {
  Exchange,
  formatDocument,
  makeOperation,
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
  fromArray,
  mergeMap,
  empty,
  Source,
} from 'wonka';

import { query, write, writeOptimistic } from './operations';
import { addMetadata, toRequestPolicy } from './helpers/operation';
import { filterVariables, getMainOperation } from './ast';
import { Store, noopDataState, hydrateData, reserveLayer } from './store';
import { Data, Dependencies, CacheExchangeOpts } from './types';

interface OperationResultWithMeta extends Partial<OperationResult> {
  operation: Operation;
  outcome: CacheOutcome;
  dependencies: Dependencies;
}

type Operations = Set<number>;
type OperationMap = Map<number, Operation>;
type ResultMap = Map<number, Data | null>;
type OptimisticDependencies = Map<number, Dependencies>;
type DependentOperations = Map<string, Operations>;

export const cacheExchange = <C extends Partial<CacheExchangeOpts>>(
  opts?: C
): Exchange => ({ forward, client, dispatchDebug }) => {
  const store = new Store<C>(opts);

  if (opts && opts.storage) {
    opts.storage.readData().then(entries => {
      hydrateData(store.data, opts!.storage!, entries);
    });
  }

  const optimisticKeysToDependencies: OptimisticDependencies = new Map();
  const mutationResultBuffer: OperationResult[] = [];
  const operations: OperationMap = new Map();
  const results: ResultMap = new Map();
  const blockedDependencies: Dependencies = new Set();
  const requestedRefetch: Operations = new Set();
  const deps: DependentOperations = new Map();

  let reexecutingOperations: Operations = new Set();
  let dependentOperations: Operations = new Set();

  const isBlockedByOptimisticUpdate = (dependencies: Dependencies): boolean => {
    for (const dep of dependencies.values())
      if (blockedDependencies.has(dep)) return true;
    return false;
  };

  const collectPendingOperations = (
    pendingOperations: Operations,
    dependencies: undefined | Dependencies
  ) => {
    if (dependencies) {
      // Collect operations that will be updated due to cache changes
      for (const dep of dependencies.values()) {
        const keys = deps.get(dep);
        if (keys) for (const key of keys.values()) pendingOperations.add(key);
      }
    }
  };

  const executePendingOperations = (
    operation: Operation,
    pendingOperations: Operations
  ) => {
    // Reexecute collected operations and delete them from the mapping
    for (const key of pendingOperations.values()) {
      if (key !== operation.key) {
        const op = operations.get(key);
        if (op) {
          // Collect all dependent operations if the reexecuting operation is a query
          if (operation.kind === 'query') dependentOperations.add(key);
          operations.delete(key);
          let policy: RequestPolicy = 'cache-first';
          if (requestedRefetch.has(key)) {
            requestedRefetch.delete(key);
            policy = 'cache-and-network';
          }
          client.reexecuteOperation(toRequestPolicy(op, policy));
        }
      }
    }

    // Upon completion, all dependent operations become reexecuting operations, preventing
    // them from reexecuting prior operations again, causing infinite loops
    const _reexecutingOperations = reexecutingOperations;
    if (operation.kind === 'query') {
      (reexecutingOperations = dependentOperations).add(operation.key);
    }
    (dependentOperations = _reexecutingOperations).clear();
  };

  // This registers queries with the data layer to ensure commutativity
  const prepareForwardedOperation = (operation: Operation) => {
    if (operation.kind === 'query') {
      // Pre-reserve the position of the result layer
      reserveLayer(store.data, operation.key);
    } else if (operation.kind === 'teardown') {
      // Delete reference to operation if any exists to release it
      operations.delete(operation.key);
      results.delete(operation.key);
      reexecutingOperations.delete(operation.key);
      // Mark operation layer as done
      noopDataState(store.data, operation.key);
    } else if (
      operation.kind === 'mutation' &&
      operation.context.requestPolicy !== 'network-only'
    ) {
      // This executes an optimistic update for mutations and registers it if necessary
      const { dependencies } = writeOptimistic(store, operation, operation.key);
      if (dependencies.size) {
        // Update blocked optimistic dependencies
        for (const dep of dependencies.values()) blockedDependencies.add(dep);

        // Store optimistic dependencies for update
        optimisticKeysToDependencies.set(operation.key, dependencies);

        // Update related queries
        const pendingOperations: Operations = new Set();
        collectPendingOperations(pendingOperations, dependencies);
        executePendingOperations(operation, pendingOperations);
      }
    }

    return makeOperation(
      operation.kind,
      {
        key: operation.key,
        query: formatDocument(operation.query),
        variables: operation.variables
          ? filterVariables(
              getMainOperation(operation.query),
              operation.variables
            )
          : operation.variables,
      },
      { ...operation.context, originalVariables: operation.variables }
    );
  };

  // This updates the known dependencies for the passed operation
  const updateDependencies = (op: Operation, dependencies: Dependencies) => {
    for (const dep of dependencies.values()) {
      let depOps = deps.get(dep);
      if (!depOps) deps.set(dep, (depOps = new Set()));
      depOps.add(op.key);
    }
  };

  // Retrieves a query result from cache and adds an `isComplete` hint
  // This hint indicates whether the result is "complete" or not
  const operationResultFromCache = (
    operation: Operation
  ): OperationResultWithMeta => {
    const result = query(store, operation, results.get(operation.key));
    const cacheOutcome: CacheOutcome = result.data
      ? !result.partial
        ? 'hit'
        : 'partial'
      : 'miss';

    results.set(operation.key, result.data);
    operations.set(operation.key, operation);
    updateDependencies(operation, result.dependencies);

    return {
      outcome: cacheOutcome,
      operation,
      data: result.data,
      dependencies: result.dependencies,
    };
  };

  // Take any OperationResult and update the cache with it
  const updateCacheWithResult = (
    result: OperationResult,
    pendingOperations: Operations
  ): OperationResult => {
    // Retrieve the original operation to remove changes made by formatDocument
    const originalOperation = operations.get(result.operation.key);
    const operation = originalOperation
      ? makeOperation(
          originalOperation.kind,
          originalOperation,
          result.operation.context
        )
      : result.operation;

    if (operation.kind === 'mutation') {
      if (result.operation.context.originalVariables) {
        operation.variables = result.operation.context.originalVariables;
        delete result.operation.context.originalVariables;
      }

      // Collect previous dependencies that have been written for optimistic updates
      const dependencies = optimisticKeysToDependencies.get(operation.key);
      collectPendingOperations(pendingOperations, dependencies);
      optimisticKeysToDependencies.delete(operation.key);
    }

    if (operation.kind === 'subscription' || result.hasNext)
      reserveLayer(store.data, operation.key, true);

    let queryDependencies: void | Dependencies;
    let data: Data | null = result.data;
    if (data) {
      // Write the result to cache and collect all dependencies that need to be
      // updated
      const writeDependencies = write(
        store,
        operation,
        data,
        result.error,
        operation.key
      ).dependencies;
      collectPendingOperations(pendingOperations, writeDependencies);

      const queryResult = query(
        store,
        operation,
        operation.kind === 'query' ? results.get(operation.key) || data : data,
        result.error,
        operation.key
      );

      data = queryResult.data;
      if (operation.kind === 'query') {
        // Collect the query's dependencies for future pending operation updates
        queryDependencies = queryResult.dependencies;
        collectPendingOperations(pendingOperations, queryDependencies);
        results.set(operation.key, data);
      }
    } else {
      noopDataState(store.data, operation.key);
    }

    // Update this operation's dependencies if it's a query
    if (queryDependencies) {
      operations.set(operation.key, operation);
      updateDependencies(result.operation, queryDependencies);
    }

    return {
      operation,
      data,
      error: result.error,
      extensions: result.extensions,
      hasNext: result.hasNext,
      stale: result.stale,
    };
  };

  return ops$ => {
    const sharedOps$ = pipe(ops$, share);

    // Filter by operations that are cacheable and attempt to query them from the cache
    const cacheOps$ = pipe(
      sharedOps$,
      filter(
        op => op.kind === 'query' && op.context.requestPolicy !== 'network-only'
      ),
      map(operationResultFromCache),
      share
    );

    const nonCacheOps$ = pipe(
      sharedOps$,
      filter(
        op => op.kind !== 'query' || op.context.requestPolicy === 'network-only'
      )
    );

    // Rebound operations that are incomplete, i.e. couldn't be queried just from the cache
    const cacheMissOps$ = pipe(
      cacheOps$,
      filter(
        res =>
          res.outcome === 'miss' &&
          res.operation.context.requestPolicy !== 'cache-only' &&
          !isBlockedByOptimisticUpdate(res.dependencies) &&
          !reexecutingOperations.has(res.operation.key)
      ),
      map(res => {
        dispatchDebug({
          type: 'cacheMiss',
          message: 'The result could not be retrieved from the cache',
          operation: res.operation,
        });
        return addMetadata(res.operation, { cacheOutcome: 'miss' });
      })
    );

    // Resolve OperationResults that the cache was able to assemble completely and trigger
    // a network request if the current operation's policy is cache-and-network
    const cacheResult$ = pipe(
      cacheOps$,
      filter(
        res =>
          res.outcome !== 'miss' ||
          res.operation.context.requestPolicy === 'cache-only'
      ),
      map(
        (res: OperationResultWithMeta): OperationResult => {
          const { requestPolicy } = res.operation.context;

          // We don't mark cache-only responses as partial, as this would indicate
          // that we expect a new result to come from the network, which cannot
          // happen
          const isPartial =
            res.outcome === 'partial' && requestPolicy !== 'cache-only';

          // We reexecute requests marked as `cache-and-network`, and partial responses,
          // if we wouldn't cause a request loop
          const shouldReexecute =
            requestPolicy === 'cache-and-network' ||
            (requestPolicy === 'cache-first' &&
              isPartial &&
              !reexecutingOperations.has(res.operation.key));

          const result: OperationResult = {
            operation: addMetadata(res.operation, {
              cacheOutcome: res.outcome,
            }),
            data: res.data,
            error: res.error,
            extensions: res.extensions,
            stale: shouldReexecute || isPartial,
            hasNext: false,
          };

          if (!shouldReexecute) {
            /*noop*/
          } else if (!isBlockedByOptimisticUpdate(res.dependencies)) {
            client.reexecuteOperation(
              toRequestPolicy(res.operation, 'network-only')
            );
          } else if (requestPolicy === 'cache-and-network') {
            requestedRefetch.add(res.operation.key);
          }

          dispatchDebug({
            type: 'cacheHit',
            message: `A requested operation was found and returned from the cache.`,
            operation: res.operation,
            data: {
              value: result,
            },
          });

          return result;
        }
      )
    );

    // Forward operations that aren't cacheable and rebound operations
    // Also update the cache with any network results
    const result$ = pipe(
      merge([nonCacheOps$, cacheMissOps$]),
      map(prepareForwardedOperation),
      forward,
      share
    );

    // Results that can immediately be resolved
    const nonOptimisticResults$ = pipe(
      result$,
      filter(result => !optimisticKeysToDependencies.has(result.operation.key)),
      map(result => {
        const pendingOperations: Operations = new Set();
        // Update the cache with the incoming API result
        const cacheResult = updateCacheWithResult(result, pendingOperations);
        // Execute all dependent queries
        executePendingOperations(result.operation, pendingOperations);
        return cacheResult;
      })
    );

    // Prevent mutations that were previously optimistic from being flushed
    // immediately and instead clear them out slowly
    const optimisticMutationCompletion$ = pipe(
      result$,
      filter(result => optimisticKeysToDependencies.has(result.operation.key)),
      mergeMap(
        (result: OperationResult): Source<OperationResult> => {
          const length = mutationResultBuffer.push(result);
          if (length < optimisticKeysToDependencies.size) {
            return empty;
          }

          for (let i = 0; i < mutationResultBuffer.length; i++) {
            reserveLayer(store.data, mutationResultBuffer[i].operation.key);
          }

          blockedDependencies.clear();

          const results: OperationResult[] = [];
          const pendingOperations: Operations = new Set();

          let bufferedResult: OperationResult | void;
          while ((bufferedResult = mutationResultBuffer.shift()))
            results.push(
              updateCacheWithResult(bufferedResult, pendingOperations)
            );

          // Execute all dependent queries as a single batch
          executePendingOperations(result.operation, pendingOperations);

          return fromArray(results);
        }
      )
    );

    return merge([
      nonOptimisticResults$,
      optimisticMutationCompletion$,
      cacheResult$,
    ]);
  };
};

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
  fromPromise,
  fromArray,
  mergeMap,
  empty,
  Source,
  skipUntil,
  buffer,
} from 'wonka';

import { query, write, writeOptimistic } from './operations';
import { makeDict, isDictEmpty } from './helpers/dict';
import { addCacheOutcome, toRequestPolicy } from './helpers/operation';
import { filterVariables, getMainOperation } from './ast';
import { Store, noopDataState, hydrateData, reserveLayer } from './store';
import { Data, Dependencies, CacheExchangeOpts } from './types';

type OperationResultWithMeta = OperationResult & {
  outcome: CacheOutcome;
  dependencies: Dependencies;
};

type Operations = Set<number>;
type OperationMap = Map<number, Operation>;
type ResultMap = Map<number, Data | null>;
type OptimisticDependencies = Map<number, Dependencies>;
type DependentOperations = Record<string, number[]>;

export const cacheExchange = <C extends Partial<CacheExchangeOpts>>(
  opts?: C
): Exchange => ({ forward, client, dispatchDebug }) => {
  const store = new Store<C>(opts);

  let hydration: void | Promise<void>;
  if (opts && opts.storage) {
    hydration = opts.storage.readData().then(entries => {
      hydrateData(store.data, opts!.storage!, entries);
    });
  }

  const optimisticKeysToDependencies: OptimisticDependencies = new Map();
  const mutationResultBuffer: OperationResult[] = [];
  const operations: OperationMap = new Map();
  const results: ResultMap = new Map();
  const blockedDependencies: Dependencies = makeDict();
  const requestedRefetch: Operations = new Set();
  const deps: DependentOperations = makeDict();

  const isBlockedByOptimisticUpdate = (dependencies: Dependencies): boolean => {
    for (const dep in dependencies) if (blockedDependencies[dep]) return true;
    return false;
  };

  const collectPendingOperations = (
    pendingOperations: Operations,
    dependencies: void | Dependencies
  ) => {
    if (dependencies) {
      // Collect operations that will be updated due to cache changes
      for (const dep in dependencies) {
        const keys = deps[dep];
        if (keys) {
          deps[dep] = [];
          for (let i = 0, l = keys.length; i < l; i++) {
            pendingOperations.add(keys[i]);
          }
        }
      }
    }
  };

  const executePendingOperations = (
    operation: Operation,
    pendingOperations: Operations
  ) => {
    // Reexecute collected operations and delete them from the mapping
    pendingOperations.forEach(key => {
      if (key !== operation.key) {
        const op = operations.get(key);
        if (op) {
          operations.delete(key);
          let policy: RequestPolicy = 'cache-first';
          if (requestedRefetch.has(key)) {
            requestedRefetch.delete(key);
            policy = 'cache-and-network';
          }
          client.reexecuteOperation(toRequestPolicy(op, policy));
        }
      }
    });
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
      // Mark operation layer as done
      noopDataState(store.data, operation.key);
    } else if (
      operation.kind === 'mutation' &&
      operation.context.requestPolicy !== 'network-only'
    ) {
      // This executes an optimistic update for mutations and registers it if necessary
      const { dependencies } = writeOptimistic(store, operation, operation.key);
      if (!isDictEmpty(dependencies)) {
        // Update blocked optimistic dependencies
        for (const dep in dependencies) {
          blockedDependencies[dep] = true;
        }

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
      operation.context
    );
  };

  // This updates the known dependencies for the passed operation
  const updateDependencies = (op: Operation, dependencies: Dependencies) => {
    for (const dep in dependencies) {
      (deps[dep] || (deps[dep] = [])).push(op.key);
      operations.set(op.key, op);
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
    const { operation, error, extensions } = result;
    const { key } = operation;

    if (operation.kind === 'mutation') {
      // Collect previous dependencies that have been written for optimistic updates
      const dependencies = optimisticKeysToDependencies.get(key);
      collectPendingOperations(pendingOperations, dependencies);
      optimisticKeysToDependencies.delete(key);
    }

    reserveLayer(store.data, operation.key, result.hasNext);

    let queryDependencies: void | Dependencies;
    let data: Data | null = result.data;
    if (data) {
      // Write the result to cache and collect all dependencies that need to be
      // updated
      const writeDependencies = write(store, operation, data, result.error, key)
        .dependencies;
      collectPendingOperations(pendingOperations, writeDependencies);

      const queryResult = query(
        store,
        operation,
        operation.kind === 'query' ? results.get(operation.key) || data : data,
        result.error,
        key
      );

      data = queryResult.data;
      if (operation.kind === 'query') {
        // Collect the query's dependencies for future pending operation updates
        queryDependencies = queryResult.dependencies;
        collectPendingOperations(pendingOperations, queryDependencies);
        results.set(operation.key, result.data);
      }
    } else {
      noopDataState(store.data, operation.key);
    }

    // Update this operation's dependencies if it's a query
    if (queryDependencies) {
      updateDependencies(result.operation, queryDependencies);
    }

    return { data, error, extensions, operation };
  };

  return ops$ => {
    const sharedOps$ = pipe(ops$, share);

    // Buffer operations while waiting on hydration to finish
    // If no hydration takes place we replace this stream with an empty one
    const inputOps$ = hydration
      ? share(
          merge([
            pipe(
              sharedOps$,
              buffer(fromPromise(hydration)),
              mergeMap(fromArray)
            ),
            pipe(sharedOps$, skipUntil(fromPromise(hydration))),
          ])
        )
      : sharedOps$;

    // Filter by operations that are cacheable and attempt to query them from the cache
    const cacheOps$ = pipe(
      inputOps$,
      filter(op => {
        return (
          op.kind === 'query' && op.context.requestPolicy !== 'network-only'
        );
      }),
      map(operationResultFromCache),
      share
    );

    const nonCacheOps$ = pipe(
      inputOps$,
      filter(op => {
        return (
          op.kind !== 'query' || op.context.requestPolicy === 'network-only'
        );
      })
    );

    // Rebound operations that are incomplete, i.e. couldn't be queried just from the cache
    const cacheMissOps$ = pipe(
      cacheOps$,
      filter(res => {
        return (
          res.outcome === 'miss' &&
          res.operation.context.requestPolicy !== 'cache-only' &&
          !isBlockedByOptimisticUpdate(res.dependencies)
        );
      }),
      map(res => {
        dispatchDebug({
          type: 'cacheMiss',
          message: 'The result could not be retrieved from the cache',
          operation: res.operation,
        });
        return addCacheOutcome(res.operation, 'miss');
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
          const { operation, outcome, dependencies } = res;
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
            if (!isBlockedByOptimisticUpdate(dependencies)) {
              client.reexecuteOperation(
                toRequestPolicy(operation, 'network-only')
              );
            } else if (
              operation.context.requestPolicy === 'cache-and-network'
            ) {
              requestedRefetch.add(operation.key);
            }
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

          for (const dep in blockedDependencies) {
            delete blockedDependencies[dep];
          }

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

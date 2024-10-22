import type {
  Exchange,
  Operation,
  OperationResult,
  CacheOutcome,
} from '@urql/core';
import { formatDocument, makeOperation } from '@urql/core';

import { filter, map, merge, pipe, share } from 'wonka';

import { _query } from './operations/query';
import { _write } from './operations/write';
import { addMetadata, toRequestPolicy } from './helpers/operation';
import { filterVariables, getMainOperation } from './ast';
import { Store } from './store/store';
import type { Data, Dependencies, CacheExchangeOpts } from './types';

import {
  initDataState,
  clearDataState,
  noopDataState,
  hydrateData,
  reserveLayer,
  hasLayer,
} from './store/data';

interface OperationResultWithMeta extends Partial<OperationResult> {
  operation: Operation;
  outcome: CacheOutcome;
  dependencies: Dependencies;
  hasNext: boolean;
}

type Operations = Set<number>;
type OperationMap = Map<number, Operation>;
type ResultMap = Map<number, Data | null>;

/** Exchange factory that creates a normalized cache exchange.
 *
 * @param opts - A {@link CacheExchangeOpts} configuration object.
 * @returns the created normalized cache {@link Exchange}.
 *
 * @remarks
 * Graphcache is a normalized cache, enabled by using the `cacheExchange`
 * in place of `@urql/core`’s. A normalized GraphQL cache uses typenames
 * and key fields in the result to share a single copy for each unique
 * entity across all queries.
 *
 * The `cacheExchange` may be passed a {@link CacheExchangeOpts} object
 * to define custom resolvers, custom updates for mutations,
 * optimistic updates, or to add custom key fields per type.
 *
 * @see {@link https://urql.dev/goto/docs/graphcache} for the full Graphcache docs.
 */
export const cacheExchange =
  <C extends Partial<CacheExchangeOpts>>(opts?: C): Exchange =>
  ({ forward, client, dispatchDebug }) => {
    const store = new Store<C>(opts);

    if (opts && opts.storage) {
      store.data.hydrating = true;
      opts.storage.readData().then(entries => {
        hydrateData(store.data, opts!.storage!, entries);
        if (opts.storage!.onCacheHydrated) opts.storage!.onCacheHydrated();
      });
    }

    const operations: OperationMap = new Map();
    const results: ResultMap = new Map();

    const reexecutingOperations: Operations = new Set();

    // This registers queries with the data layer to ensure commutativity
    const prepareForwardedOperation = (operation: Operation) => {
      let optimistic = false;
      if (operation.kind === 'query') {
        // Pre-reserve the position of the result layer
        reserveLayer(store.data, operation.key);
        operations.set(operation.key, operation);
      } else if (operation.kind === 'teardown') {
        // Delete reference to operation if any exists to release it
        operations.delete(operation.key);
        results.delete(operation.key);
        reexecutingOperations.delete(operation.key);
        // Mark operation layer as done
        noopDataState(store.data, operation.key);
        return operation;
      } else if (
        operation.kind === 'mutation' &&
        operation.context.requestPolicy !== 'network-only'
      ) {
        operations.set(operation.key, operation);
        // This executes an optimistic update for mutations and registers it if necessary
        initDataState('write', store.data, operation.key, true, false);
        const { dependencies } = _write(
          store,
          operation as any,
          undefined,
          undefined
        );
        clearDataState();
        if (dependencies.size) {
          // Mark operation as optimistic
          optimistic = true;
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
        { ...operation.context, optimistic }
      );
    };

    // Retrieves a query result from cache and adds an `isComplete` hint
    // This hint indicates whether the result is "complete" or not
    const operationResultFromCache = (
      operation: Operation
    ): OperationResultWithMeta => {
      initDataState('read', store.data, undefined, false, false);
      const result = _query(
        store,
        operation,
        results.get(operation.key),
        undefined
      );
      clearDataState();
      const cacheOutcome: CacheOutcome = result.data
        ? !result.partial && !result.hasNext
          ? 'hit'
          : 'partial'
        : 'miss';

      results.set(operation.key, result.data);
      operations.set(operation.key, operation);

      return {
        outcome: cacheOutcome,
        operation,
        data: result.data,
        dependencies: result.dependencies,
        hasNext: result.hasNext,
      };
    };

    // Take any OperationResult and update the cache with it
    const updateCacheWithResult = (
      result: OperationResult
    ): OperationResult => {
      // Retrieve the original operation to get unfiltered variables
      const operation =
        operations.get(result.operation.key) || result.operation;

      if (operation.kind === 'subscription' || result.hasNext)
        reserveLayer(store.data, operation.key, true);

      let data: Data | null = result.data;
      if (data) {
        // Write the result to cache and collect all dependencies that need to be
        // updated
        initDataState('write', store.data, operation.key, false, false);
        _write(store, operation, data, result.error).dependencies;
        clearDataState();
        const prevData =
          operation.kind === 'query' ? results.get(operation.key) : null;
        initDataState(
          'read',
          store.data,
          operation.key,
          false,
          prevData !== data
        );
        const queryResult = _query(
          store,
          operation,
          prevData || data,
          result.error
        );
        clearDataState();
        data = queryResult.data;
        if (operation.kind === 'query') {
          results.set(operation.key, data);
        }
      } else {
        noopDataState(store.data, operation.key);
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

    return operations$ => {
      // Filter by operations that are cacheable and attempt to query them from the cache
      const cacheOps$ = pipe(
        operations$,
        filter(
          op =>
            op.kind === 'query' && op.context.requestPolicy !== 'network-only'
        ),
        map(operationResultFromCache),
        share
      );

      const nonCacheOps$ = pipe(
        operations$,
        filter(
          op =>
            op.kind !== 'query' || op.context.requestPolicy === 'network-only'
        )
      );

      // Rebound operations that are incomplete, i.e. couldn't be queried just from the cache
      const cacheMissOps$ = pipe(
        cacheOps$,
        filter(
          res =>
            res.outcome === 'miss' &&
            res.operation.context.requestPolicy !== 'cache-only' &&
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
        map((res: OperationResultWithMeta): OperationResult => {
          const { requestPolicy } = res.operation.context;

          // We reexecute requests marked as `cache-and-network`, and partial responses,
          // if we wouldn't cause a request loop
          const shouldReexecute =
            requestPolicy !== 'cache-only' &&
            (res.hasNext ||
              requestPolicy === 'cache-and-network' ||
              (requestPolicy === 'cache-first' &&
                res.outcome === 'partial' &&
                !reexecutingOperations.has(res.operation.key)));
          // Set stale to true anyway, even if the reexecute will be blocked, if the operation
          // is in progress. We can be reasonably sure of that if a layer has been reserved for it.
          const stale =
            requestPolicy !== 'cache-only' &&
            (shouldReexecute ||
              (res.outcome === 'partial' &&
                reexecutingOperations.has(res.operation.key) &&
                hasLayer(store.data, res.operation.key)));

          const result: OperationResult = {
            operation: addMetadata(res.operation, {
              cacheOutcome: res.outcome,
            }),
            data: res.data,
            error: res.error,
            extensions: res.extensions,
            stale: stale && !res.hasNext,
            hasNext: shouldReexecute && res.hasNext,
          };

          if (!shouldReexecute) {
            /*noop*/
          } else {
            client.reexecuteOperation(
              toRequestPolicy(
                operations.get(res.operation.key) || res.operation,
                'network-only'
              )
            );
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
        })
      );

      // Forward operations that aren't cacheable and rebound operations
      // Also update the cache with any network results
      const result$ = pipe(
        merge([nonCacheOps$, cacheMissOps$]),
        map(prepareForwardedOperation),
        forward
      );

      return merge([pipe(result$, map(updateCacheWithResult)), cacheResult$]);
    };
  };

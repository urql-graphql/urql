import type {
  Exchange,
  Operation,
  OperationResult,
  RequestPolicy,
  CacheOutcome,
} from '@urql/core';
import { formatDocument, makeOperation } from '@urql/core';

import type { Source } from 'wonka';
import {
  filter,
  map,
  merge,
  onEnd,
  pipe,
  share,
  fromArray,
  mergeMap,
  empty,
} from 'wonka';

import { _query } from './operations/query';
import { _write } from './operations/write';
import { addMetadata, toRequestPolicy } from './helpers/operation';
import { filterVariables, getMainOperation } from './ast';
import { Store } from './store/store';
import type {
  Data,
  Dependencies,
  CacheExchangeOpts,
  SerializedEntries,
} from './types';

import {
  initDataState,
  clearDataState,
  noopDataState,
  hydrateData,
  reserveLayer,
  hasLayer,
  startBroadcastCapture,
  serializePendingDelta,
  applyDelta,
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
type OptimisticDependencies = Map<number, Dependencies>;
type DependentOperations = Map<string, Operations>;

type CacheBroadcastMessage =
  | {
      type: 'cacheOptimisticUpdate';
      tabId: string;
      mutationKey: number;
      entries: SerializedEntries;
      deps: string[];
    }
  | {
      type: 'cacheUpdate';
      tabId: string;
      mutationKey: number;
      entries: SerializedEntries;
      deps: string[];
    }
  | { type: 'cacheRollback'; tabId: string; mutationKey: number };

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

    const broadcastOpt = opts && opts.broadcastChannel;
    const tabId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random()
            .toString(36)
            .slice(2)
            .padStart(11, '0')}`;
    // true if user only provided a channel id not full object
    const weOwnChannel = typeof broadcastOpt === 'string';
    const channel: BroadcastChannel | null =
      typeof BroadcastChannel !== 'undefined' && broadcastOpt
        ? weOwnChannel
          ? new BroadcastChannel(broadcastOpt as string)
          : (broadcastOpt as BroadcastChannel)
        : null;

    // Local layer keys allocated for remote optimistic updates. Local keys
    // come from `phash` which produces signed 32-bit integers, so starting
    // above 2^32 guarantees no collision with `operation.key` values.
    let remoteLayerCounter = 0x100000000;
    // Mapping from `${remoteTabId}:${remoteMutationKey}` to the local layer
    // key that holds that remote mutation's optimistic data, plus the
    // dependencies the originating tab reported (so we can re-execute the
    // right queries when the layer is committed or rolled back).
    const remoteOptimisticLayers: Map<
      string,
      { localKey: number; deps: Set<string> }
    > = new Map();

    const optimisticKeysToDependencies: OptimisticDependencies = new Map();
    const mutationResultBuffer: OperationResult[] = [];
    const operations: OperationMap = new Map();
    const results: ResultMap = new Map();
    const blockedDependencies: Dependencies = new Set();
    const requestedRefetch: Operations = new Set();
    const deps: DependentOperations = new Map();

    let reexecutingOperations: Operations = new Set();
    let dependentOperations: Operations = new Set();
    let pendingBroadcasts: Array<{
      mutationKey: number;
      entries: SerializedEntries;
      deps: Dependencies;
    }> = [];

    const isBlockedByOptimisticUpdate = (
      dependencies: Dependencies
    ): boolean => {
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
      pendingOperations: Operations,
      isOptimistic: boolean
    ) => {
      // Reexecute collected operations and delete them from the mapping
      for (const key of pendingOperations.values()) {
        if (key !== operation.key) {
          const op = operations.get(key);
          if (op) {
            // Collect all dependent operations if the reexecuting operation is a query
            if (operation.kind === 'query') dependentOperations.add(key);
            let policy: RequestPolicy = 'cache-first';
            if (requestedRefetch.has(key)) {
              requestedRefetch.delete(key);
              policy = 'cache-and-network';
            }
            client.reexecuteOperation(toRequestPolicy(op, policy));
          }
        }
      }

      if (!isOptimistic) {
        // Upon completion, all dependent operations become reexecuting operations, preventing
        // them from reexecuting prior operations again, causing infinite loops
        const _reexecutingOperations = reexecutingOperations;
        reexecutingOperations = dependentOperations;
        if (operation.kind === 'query') {
          reexecutingOperations.add(operation.key);
        }
        (dependentOperations = _reexecutingOperations).clear();
      }
    };

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
        if (channel) startBroadcastCapture();
        initDataState('write', store.data, operation.key, true, false);
        const { dependencies } = _write(
          store,
          operation as any,
          undefined,
          undefined
        );
        const optimisticDelta = channel ? serializePendingDelta() : null;
        clearDataState();
        if (dependencies.size) {
          // Update blocked optimistic dependencies
          for (const dep of dependencies.values()) blockedDependencies.add(dep);
          // Store optimistic dependencies for update
          optimisticKeysToDependencies.set(operation.key, dependencies);
          // Update related queries
          const pendingOperations: Operations = new Set();
          collectPendingOperations(pendingOperations, dependencies);
          executePendingOperations(operation, pendingOperations, true);
          // Mark operation as optimistic
          optimistic = true;
          if (
            channel &&
            optimisticDelta &&
            Object.keys(optimisticDelta).length
          ) {
            channel.postMessage({
              type: 'cacheOptimisticUpdate',
              tabId,
              mutationKey: operation.key,
              entries: optimisticDelta,
              deps: [...dependencies],
            } as CacheBroadcastMessage);
          }
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
      updateDependencies(operation, result.dependencies);

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
      result: OperationResult,
      pendingOperations: Operations
    ): OperationResult => {
      // Retrieve the original operation to get unfiltered variables
      const operation =
        operations.get(result.operation.key) || result.operation;
      const hadOptimistic = channel
        ? optimisticKeysToDependencies.has(operation.key)
        : false;
      if (operation.kind === 'mutation') {
        // Collect previous dependencies that have been written for optimistic updates
        const dependencies = optimisticKeysToDependencies.get(operation.key);
        collectPendingOperations(pendingOperations, dependencies);
        optimisticKeysToDependencies.delete(operation.key);
      }

      if (operation.kind === 'subscription' || result.hasNext)
        reserveLayer(store.data, operation.key, true);

      let queryDependencies: undefined | Dependencies;
      let data: Data | null = result.data;
      if (data) {
        // Write the result to cache and collect all dependencies that need to be
        // updated
        if (channel && operation.kind === 'mutation') startBroadcastCapture();
        initDataState('write', store.data, operation.key, false, false);
        const writeDependencies = _write(
          store,
          operation,
          data,
          result.error
        ).dependencies;
        if (channel && operation.kind === 'mutation') {
          const entries = serializePendingDelta();
          if (Object.keys(entries).length) {
            pendingBroadcasts.push({
              mutationKey: operation.key,
              entries,
              deps: writeDependencies,
            });
          }
        }
        clearDataState();
        collectPendingOperations(pendingOperations, writeDependencies);
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
          // Collect the query's dependencies for future pending operation updates
          queryDependencies = queryResult.dependencies;
          collectPendingOperations(pendingOperations, queryDependencies);
          results.set(operation.key, data);
        }
      } else {
        noopDataState(store.data, operation.key);
        if (channel && hadOptimistic) {
          channel.postMessage({
            type: 'cacheRollback',
            tabId,
            mutationKey: operation.key,
          } as CacheBroadcastMessage);
        }
      }

      // Update this operation's dependencies if it's a query
      if (queryDependencies) {
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

    const reexecuteForDeps = (depsToCheck: Set<string>) => {
      const pending: Operations = new Set();
      collectPendingOperations(pending, depsToCheck);
      for (const key of pending) {
        const op = operations.get(key);
        if (op) client.reexecuteOperation(toRequestPolicy(op, 'cache-first'));
      }
    };

    const handleBroadcastMessage = (event: MessageEvent) => {
      const msg = event.data as CacheBroadcastMessage | undefined;
      if (!msg || msg.tabId === tabId) return;
      const remoteKey = `${msg.tabId}:${msg.mutationKey}`;

      if (msg.type === 'cacheOptimisticUpdate') {
        // Allocate a local layer key in a number space disjoint from
        // `operation.key` (which is a 32-bit hash). This prevents the remote
        // optimistic write from clobbering layers reserved for the receiver's
        // own queries or mutations that might happen to share the same key.
        const localKey = remoteLayerCounter++;
        applyDelta(store.data, msg.entries, localKey, true);
        remoteOptimisticLayers.set(remoteKey, {
          localKey,
          deps: new Set(msg.deps),
        });
        reexecuteForDeps(new Set(msg.deps));
      } else if (msg.type === 'cacheUpdate') {
        const existing = remoteOptimisticLayers.get(remoteKey);
        if (existing) {
          // Commit the new entries through the existing remote layer as a
          // commutative+dirty layer so `clearDataState`'s squash loop folds
          // it into the base layer cleanly. This replaces the optimistic
          // data with the authoritative result in a single step.
          applyDelta(store.data, msg.entries, existing.localKey, false);
          remoteOptimisticLayers.delete(remoteKey);
        } else {
          // No prior optimistic update from this remote mutation — write
          // straight to the base layer.
          applyDelta(store.data, msg.entries);
        }
        reexecuteForDeps(new Set(msg.deps));
      } else if (msg.type === 'cacheRollback') {
        const existing = remoteOptimisticLayers.get(remoteKey);
        if (!existing) return;
        noopDataState(store.data, existing.localKey);
        remoteOptimisticLayers.delete(remoteKey);
        reexecuteForDeps(existing.deps);
      }
    };

    let removeBroadcastListeners: (() => void) | null = null;
    if (channel) {
      channel.addEventListener('message', handleBroadcastMessage);

      // If this tab unloads while remote tabs still hold optimistic layers
      // we created, broadcast a rollback for each so they don't leak.
      // `pagehide` is more reliable than `beforeunload` on mobile browsers,
      // so we listen for both and de-duplicate via a flag.
      let unloadHandled = false;
      const handleUnload = () => {
        if (unloadHandled || !channel) return;
        unloadHandled = true;
        for (const mutationKey of optimisticKeysToDependencies.keys()) {
          channel.postMessage({
            type: 'cacheRollback',
            tabId,
            mutationKey,
          } as CacheBroadcastMessage);
        }
      };

      const hasWindow = typeof window !== 'undefined';
      if (hasWindow) {
        window.addEventListener('pagehide', handleUnload);
        window.addEventListener('beforeunload', handleUnload);
      }

      removeBroadcastListeners = () => {
        channel.removeEventListener('message', handleBroadcastMessage);
        if (hasWindow) {
          window.removeEventListener('pagehide', handleUnload);
          window.removeEventListener('beforeunload', handleUnload);
        }
      };
    }

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
          } else if (!isBlockedByOptimisticUpdate(res.dependencies)) {
            client.reexecuteOperation(
              toRequestPolicy(
                operations.get(res.operation.key) || res.operation,
                'network-only'
              )
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
        })
      );

      // Forward operations that aren't cacheable and rebound operations
      // Also update the cache with any network results
      const result$ = pipe(
        merge([nonCacheOps$, cacheMissOps$]),
        map(prepareForwardedOperation),
        forward
      );

      // Results that can immediately be resolved
      const nonOptimisticResults$ = pipe(
        result$,
        filter(
          result => !optimisticKeysToDependencies.has(result.operation.key)
        ),
        map(result => {
          const pendingOperations: Operations = new Set();
          // Update the cache with the incoming API result
          const cacheResult = updateCacheWithResult(result, pendingOperations);
          // Execute all dependent queries
          executePendingOperations(result.operation, pendingOperations, false);
          if (channel && pendingBroadcasts.length) {
            for (const broadcast of pendingBroadcasts)
              channel.postMessage({
                type: 'cacheUpdate',
                tabId,
                mutationKey: broadcast.mutationKey,
                entries: broadcast.entries,
                deps: [...broadcast.deps],
              } as CacheBroadcastMessage);
            pendingBroadcasts = [];
          }
          return cacheResult;
        })
      );

      // Prevent mutations that were previously optimistic from being flushed
      // immediately and instead clear them out slowly
      const optimisticMutationCompletion$ = pipe(
        result$,
        filter(result =>
          optimisticKeysToDependencies.has(result.operation.key)
        ),
        mergeMap((result: OperationResult): Source<OperationResult> => {
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
          executePendingOperations(result.operation, pendingOperations, false);

          if (channel && pendingBroadcasts.length) {
            for (const broadcast of pendingBroadcasts)
              channel.postMessage({
                type: 'cacheUpdate',
                tabId,
                mutationKey: broadcast.mutationKey,
                entries: broadcast.entries,
                deps: [...broadcast.deps],
              } as CacheBroadcastMessage);
            pendingBroadcasts = [];
          }

          return fromArray(results);
        })
      );

      return pipe(
        merge([
          nonOptimisticResults$,
          optimisticMutationCompletion$,
          cacheResult$,
        ]),
        onEnd(() => {
          if (removeBroadcastListeners) removeBroadcastListeners();
          if (channel && weOwnChannel) channel.close();
        })
      );
    };
  };

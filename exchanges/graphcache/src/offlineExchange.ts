import { pipe, share, merge, makeSubject, filter, onPush } from 'wonka';

import {
  Operation,
  OperationResult,
  Exchange,
  ExchangeIO,
  CombinedError,
  RequestPolicy,
  stringifyDocument,
  createRequest,
  makeOperation,
} from '@urql/core';

import { SerializedRequest, CacheExchangeOpts, StorageAdapter } from './types';
import { cacheExchange } from './cacheExchange';
import { toRequestPolicy } from './helpers/operation';

const policyLevel = {
  'cache-only': 0,
  'cache-first': 1,
  'network-only': 2,
  'cache-and-network': 3,
} as const;

/** Input parameters for the {@link offlineExchange}.
 * @remarks
 * This configuration object extends the {@link CacheExchangeOpts}
 * as the `offlineExchange` extends the regular {@link cacheExchange}.
 */
export interface OfflineExchangeOpts extends CacheExchangeOpts {
  /** Configures an offline storage adapter for Graphcache.
   *
   * @remarks
   * A {@link StorageAdapter} allows Graphcache to write data to an external,
   * asynchronous storage, and hydrate data from it when it first loads.
   * This allows you to preserve normalized data between restarts/reloads.
   *
   * @see {@link https://urql.dev/goto/docs/graphcache/offline} for the full Offline Support docs.
   */
  storage: StorageAdapter;
  /** Predicate function to determine whether a {@link CombinedError} hints at a network error.
   *
   * @remarks
   * Not ever {@link CombinedError} means that the device is offline and by default
   * the `offlineExchange` will check for common network error messages and check
   * `navigator.onLine`. However, when `isOfflineError` is passed it can replace
   * the default offline detection.
   */
  isOfflineError?(
    error: undefined | CombinedError,
    result: OperationResult
  ): boolean;
}

/** Exchange factory that creates a normalized cache exchange in Offline Support mode.
 *
 * @param opts - A {@link OfflineExchangeOpts} configuration object.
 * @returns the created normalized, offline cache {@link Exchange}.
 *
 * @remarks
 * The `offlineExchange` is a wrapper around the regular {@link cacheExchange}
 * which adds logic via the {@link OfflineExchangeOpts.storage} adapter to
 * recognize when it’s offline, when to retry failed mutations, and how
 * to handle longer periods of being offline.
 *
 * @see {@link https://urql.dev/goto/docs/graphcache/offline} for the full Offline Support docs.
 */
export const offlineExchange =
  <C extends OfflineExchangeOpts>(opts: C): Exchange =>
  input => {
    const { storage } = opts;

    const isOfflineError =
      opts.isOfflineError ||
      ((error: undefined | CombinedError) =>
        error &&
        error.networkError &&
        !error.response &&
        ((typeof navigator !== 'undefined' && navigator.onLine === false) ||
          /request failed|failed to fetch|network\s?error/i.test(
            error.networkError.message
          )));

    if (
      storage &&
      storage.onOnline &&
      storage.readMetadata &&
      storage.writeMetadata
    ) {
      const { forward: outerForward, client, dispatchDebug } = input;
      const { source: reboundOps$, next } = makeSubject<Operation>();
      const failedQueue: Operation[] = [];
      let hasRehydrated = false;
      let isFlushingQueue = false;

      const updateMetadata = () => {
        if (hasRehydrated) {
          const requests: SerializedRequest[] = [];
          for (let i = 0; i < failedQueue.length; i++) {
            const operation = failedQueue[i];
            if (operation.kind === 'mutation') {
              requests.push({
                query: stringifyDocument(operation.query),
                variables: operation.variables,
                extensions: operation.extensions,
              });
            }
          }
          storage.writeMetadata!(requests);
        }
      };

      const filterQueue = (key: number) => {
        for (let i = failedQueue.length - 1; i >= 0; i--)
          if (failedQueue[i].key === key) failedQueue.splice(i, 1);
      };

      const flushQueue = () => {
        if (!isFlushingQueue) {
          const sent = new Set<number>();
          isFlushingQueue = true;
          for (let i = 0; i < failedQueue.length; i++) {
            const operation = failedQueue[i];
            if (operation.kind === 'mutation' || !sent.has(operation.key)) {
              sent.add(operation.key);
              if (operation.kind !== 'subscription') {
                next(makeOperation('teardown', operation));
                let overridePolicy: RequestPolicy = 'cache-first';
                for (let i = 0; i < failedQueue.length; i++) {
                  const { requestPolicy } = failedQueue[i].context;
                  if (policyLevel[requestPolicy] > policyLevel[overridePolicy])
                    overridePolicy = requestPolicy;
                }
                next(toRequestPolicy(operation, overridePolicy));
              } else {
                next(toRequestPolicy(operation, 'cache-first'));
              }
            }
          }
          isFlushingQueue = false;
          failedQueue.length = 0;
          updateMetadata();
        }
      };

      const forward: ExchangeIO = ops$ => {
        return pipe(
          outerForward(ops$),
          filter(res => {
            if (
              hasRehydrated &&
              res.operation.kind === 'mutation' &&
              res.operation.context.optimistic &&
              isOfflineError(res.error, res)
            ) {
              failedQueue.push(res.operation);
              updateMetadata();
              return false;
            }

            return true;
          }),
          share
        );
      };

      const cacheResults$ = cacheExchange({
        ...opts,
        storage: {
          ...storage,
          readData() {
            const hydrate = storage.readData();
            return {
              async then(onEntries) {
                const mutations = await storage.readMetadata!();
                for (let i = 0; mutations && i < mutations.length; i++) {
                  failedQueue.push(
                    client.createRequestOperation(
                      'mutation',
                      createRequest(mutations[i].query, mutations[i].variables),
                      mutations[i].extensions
                    )
                  );
                }
                onEntries!(await hydrate);
                storage.onOnline!(flushQueue);
                hasRehydrated = true;
                flushQueue();
              },
            };
          },
        },
      })({
        client,
        dispatchDebug,
        forward,
      });

      return operations$ => {
        const opsAndRebound$ = merge([
          reboundOps$,
          pipe(
            operations$,
            onPush(operation => {
              if (operation.kind === 'query' && !hasRehydrated) {
                failedQueue.push(operation);
              } else if (operation.kind === 'teardown') {
                filterQueue(operation.key);
              }
            })
          ),
        ]);

        return pipe(
          cacheResults$(opsAndRebound$),
          filter(res => {
            if (res.operation.kind === 'query') {
              if (isOfflineError(res.error, res)) {
                next(toRequestPolicy(res.operation, 'cache-only'));
                failedQueue.push(res.operation);
                return false;
              } else if (!hasRehydrated) {
                filterQueue(res.operation.key);
              }
            }
            return true;
          })
        );
      };
    }

    return cacheExchange(opts)(input);
  };

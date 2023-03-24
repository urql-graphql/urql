import { pipe, merge, makeSubject, filter } from 'wonka';
import { SelectionNode } from 'graphql';

import {
  Operation,
  OperationResult,
  Exchange,
  ExchangeIO,
  CombinedError,
  stringifyDocument,
  createRequest,
  makeOperation,
} from '@urql/core';

import {
  getMainOperation,
  getFragments,
  isInlineFragment,
  isFieldNode,
  shouldInclude,
  getSelectionSet,
  getName,
} from './ast';

import {
  SerializedRequest,
  OptimisticMutationConfig,
  Variables,
  CacheExchangeOpts,
  StorageAdapter,
} from './types';

import { cacheExchange } from './cacheExchange';
import { toRequestPolicy } from './helpers/operation';

/** Determines whether a given query contains an optimistic mutation field */
const isOptimisticMutation = <T extends OptimisticMutationConfig>(
  config: T,
  operation: Operation
) => {
  const vars: Variables = operation.variables || {};
  const fragments = getFragments(operation.query);
  const selections = [...getSelectionSet(getMainOperation(operation.query))];

  let field: void | SelectionNode;
  while ((field = selections.pop())) {
    if (!shouldInclude(field, vars)) {
      continue;
    } else if (!isFieldNode(field)) {
      const fragmentNode = !isInlineFragment(field)
        ? fragments[getName(field)]
        : field;
      if (fragmentNode) selections.push(...getSelectionSet(fragmentNode));
    } else if (config[getName(field)]) {
      return true;
    }
  }

  return false;
};

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
      const optimisticMutations = opts.optimistic || {};
      const failedQueue: Operation[] = [];

      const updateMetadata = () => {
        const requests: SerializedRequest[] = [];
        for (let i = 0; i < failedQueue.length; i++) {
          const operation = failedQueue[i];
          if (operation.kind === 'mutation') {
            requests.push({
              query: stringifyDocument(ooperation.query),
              variables: operation.variables,
            });
          }
        }
        storage.writeMetadata!(requests);
      };

      let isFlushingQueue = false;
      const flushQueue = () => {
        if (!isFlushingQueue) {
          isFlushingQueue = true;

          for (let i = 0; i < failedQueue.length; i++) {
            const operation = failedQueue[i];
            if (operation.kind === 'mutation') {
              next(makeOperation('teardown', operation));
            }
          }

          for (let i = 0; i < failedQueue.length; i++)
            client.reexecuteOperation(failedQueue[i]);

          failedQueue.length = 0;
          isFlushingQueue = false;
          updateMetadata();
        }
      };

      const forward: ExchangeIO = ops$ => {
        return pipe(
          outerForward(ops$),
          filter(res => {
            if (
              res.operation.kind === 'mutation' &&
              isOfflineError(res.error, res) &&
              isOptimisticMutation(optimisticMutations, res.operation)
            ) {
              failedQueue.push(res.operation);
              updateMetadata();
              return false;
            }

            return true;
          })
        );
      };

      storage
        .readMetadata()
        .then(mutations => {
          if (mutations) {
            for (let i = 0; i < mutations.length; i++) {
              failedQueue.push(
                client.createRequestOperation(
                  'mutation',
                  createRequest(mutations[i].query, mutations[i].variables)
                )
              );
            }

            flushQueue();
          }
        })
        .finally(() => storage.onOnline!(flushQueue));

      const cacheResults$ = cacheExchange({
        ...opts,
        storage: {
          ...storage,
          readData() {
            return storage.readData().finally(flushQueue);
          },
        },
      })({
        client,
        dispatchDebug,
        forward,
      });

      return operations$ => {
        const opsAndRebound$ = merge([reboundOps$, operations$]);

        return pipe(
          cacheResults$(opsAndRebound$),
          filter(res => {
            if (
              res.operation.kind === 'query' &&
              isOfflineError(res.error, res)
            ) {
              next(toRequestPolicy(res.operation, 'cache-only'));
              failedQueue.push(res.operation);
              return false;
            }

            return true;
          })
        );
      };
    }

    return cacheExchange(opts)(input);
  };

import { pipe, merge, makeSubject, share, filter } from 'wonka';
import { print, SelectionNode } from 'graphql';

import {
  Operation,
  Exchange,
  ExchangeIO,
  CombinedError,
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

const isOfflineError = (error: undefined | CombinedError) =>
  !!error?.networkError;

export const offlineExchange = <C extends Partial<CacheExchangeOpts>>(
  opts: C
): Exchange => input => {
  const { storage } = opts;
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
            query: print(operation.query),
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
            isOfflineError(res.error) &&
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

    return ops$ => {
      const sharedOps$ = pipe(ops$, share);

      const opsAndRebound$ = merge([reboundOps$, sharedOps$]);

      return pipe(
        cacheResults$(opsAndRebound$),
        filter(res => {
          if (res.operation.kind === 'query' && isOfflineError(res.error)) {
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

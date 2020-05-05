import { pipe, filter } from 'wonka';
import { SelectionNode } from 'graphql';
import { Operation, Exchange, CombinedError } from '@urql/core';

import {
  getMainOperation,
  getFragments,
  isInlineFragment,
  isFieldNode,
  shouldInclude,
  getSelectionSet,
  getName,
} from './ast';

import { makeDict } from './helpers/dict';
import { OptimisticMutationConfig, Variables } from './types';
import { cacheExchange, CacheExchangeOpts } from './cacheExchange';

/** Determines whether a given query contains an optimistic mutation field */
const isOptimisticMutation = (
  config: OptimisticMutationConfig,
  operation: Operation
) => {
  const vars: Variables = operation.variables || makeDict();
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
  error &&
  error.networkError &&
  !error.response &&
  ((typeof navigator !== 'undefined' && navigator.onLine === false) ||
    /request failed|failed to fetch|network\s?error/i.test(
      error.networkError.message
    ));

export const offlineExchange = (opts: CacheExchangeOpts): Exchange => ({
  forward,
  client,
  dispatchDebug,
}) => {
  if (opts.storage && opts.storage.onOnline) {
    const optimisticMutations = opts.optimistic || {};
    const failedQueue: Operation[] = [];

    forward = ops$ => {
      return pipe(
        forward(ops$),
        filter(res => {
          if (
            res.operation.operationName === 'mutation' &&
            isOfflineError(res.error) &&
            isOptimisticMutation(optimisticMutations, res.operation)
          ) {
            failedQueue.push(res.operation);
            return false;
          }

          return true;
        })
      );
    };

    const flushQueue = () => {
      for (let i = 0; i < failedQueue.length; i++) {
        let operation = failedQueue[i];
        operation = client.createRequestOperation('mutation', operation);
        client.dispatchOperation(operation);
      }
    };

    opts.storage.onOnline(flushQueue);
  }

  return cacheExchange(opts)({
    forward,
    client,
    dispatchDebug,
  });
};

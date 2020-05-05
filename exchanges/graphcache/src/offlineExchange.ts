import { pipe, filter } from 'wonka';
import { print, SelectionNode } from 'graphql';

import {
  Operation,
  Exchange,
  CombinedError,
  createRequest,
  stringifyVariables,
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
  const { storage } = opts;

  if (
    storage &&
    storage.onOnline &&
    storage.readMetadata &&
    storage.writeMetadata
  ) {
    const optimisticMutations = opts.optimistic || {};
    const failedQueue: Operation[] = [];

    const updateMetadata = () => {
      const mutations = failedQueue.map(op => ({
        query: print(op.query),
        variables: op.variables,
      }));
      storage.writeMetadata!(stringifyVariables(mutations));
    };

    let _flushing = false;
    const flushQueue = () => {
      if (!_flushing) {
        _flushing = true;

        let operation: void | Operation;
        while ((operation = failedQueue.shift())) {
          operation = client.createRequestOperation('mutation', operation);
          client.dispatchOperation(operation);
        }

        updateMetadata();
      }
    };

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
            updateMetadata();
            return false;
          }

          return true;
        })
      );
    };

    storage.onOnline(flushQueue);
    storage.readMetadata().then(json => {
      try {
        const metadata = JSON.parse(json);
        const mutations = Array.isArray(metadata.mutations)
          ? metadata.mutations
          : [];
        failedQueue.push(
          ...mutations.map((queued: any) =>
            createRequest(queued.query, queued.variables)
          )
        );
      } catch (_err) {}

      flushQueue();
    });
  }

  return cacheExchange(opts)({
    forward,
    client,
    dispatchDebug,
  });
};

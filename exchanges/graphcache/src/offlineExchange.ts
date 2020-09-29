import { pipe, merge, makeSubject, share, filter } from 'wonka';
import { print, SelectionNode } from 'graphql';

import {
  Operation,
  GraphQLRequest,
  Exchange,
  ExchangeIO,
  CombinedError,
  createRequest,
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
import { toRequestPolicy } from './helpers/operation';

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

export const offlineExchange = (opts: CacheExchangeOpts): Exchange => input => {
  const { storage } = opts;

  if (
    storage &&
    storage.onOnline &&
    storage.readMetadata &&
    storage.writeMetadata
  ) {
    const { forward: outerForward, client, dispatchDebug } = input;
    const optimisticMutations = opts.optimistic || {};
    const failedQueue: GraphQLRequest[] = [];

    const updateMetadata = () => {
      storage.writeMetadata!(
        failedQueue.map(op => ({
          query: print(op.query),
          variables: op.variables,
        }))
      );
    };

    let _flushing = false;
    const flushQueue = () => {
      let request: void | GraphQLRequest;
      while (!_flushing && (request = failedQueue.shift())) {
        _flushing = true;
        client.dispatchOperation(
          client.createRequestOperation('mutation', request)
        );
        _flushing = false;
      }

      updateMetadata();
    };

    const forward: ExchangeIO = ops$ => {
      return pipe(
        outerForward(ops$),
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
    storage.readMetadata().then(mutations => {
      if (mutations)
        for (let i = 0; i < mutations.length; i++)
          failedQueue.push(
            createRequest(mutations[i].query, mutations[i].variables)
          );
      flushQueue();
    });

    const cacheResults$ = cacheExchange(opts)({
      client,
      dispatchDebug,
      forward,
    });

    return ops$ => {
      const sharedOps$ = share(ops$);
      const { source: reboundOps$, next } = makeSubject<Operation>();
      const opsAndRebound$ = merge([reboundOps$, sharedOps$]);

      return pipe(
        cacheResults$(opsAndRebound$),
        filter(res => {
          if (
            res.operation.operationName === 'query' &&
            isOfflineError(res.error)
          ) {
            next(toRequestPolicy(res.operation, 'cache-only'));
            return false;
          }

          return true;
        })
      );
    };
  }

  return cacheExchange(opts)(input);
};

/* eslint-disable @typescript-eslint/no-use-before-define */
import { print } from 'graphql';
import { filter, make, merge, mergeMap, pipe, share, takeUntil } from 'wonka';
import { Exchange, Operation, OperationResult } from '../types';
import { CombinedError } from '../utils/error';

/** A default exchange for fetching GraphQL requests. */
export const fetchExchange: Exchange = ({ forward }) => {
  const isOperationFetchable = (operation: Operation) => {
    const { operationName } = operation;
    return operationName === 'query' || operationName === 'mutation';
  };

  return ops$ => {
    const sharedOps$ = share(ops$);
    const fetchResults$ = pipe(
      sharedOps$,
      filter(isOperationFetchable),
      mergeMap(operation => {
        const { key } = operation;
        const teardown$ = pipe(
          sharedOps$,
          filter(op => op.operationName === 'teardown' && op.key === key)
        );

        return pipe(
          createFetchSource(operation),
          takeUntil(teardown$)
        );
      })
    );

    const forward$ = pipe(
      sharedOps$,
      filter(op => !isOperationFetchable(op)),
      forward
    );

    return merge([fetchResults$, forward$]);
  };
};

const createFetchSource = (operation: Operation) => {
  if (operation.operationName === 'subscription') {
    throw new Error(
      'Received a subscription operation in the httpExchange. You are probably trying to create a subscription. Have you added a subscriptionExchange?'
    );
  }

  return make<OperationResult>(([next, complete]) => {
    const abortController =
      typeof AbortController !== 'undefined'
        ? new AbortController()
        : undefined;

    const { context } = operation;

    const extraOptions =
      typeof context.fetchOptions === 'function'
        ? context.fetchOptions()
        : context.fetchOptions || {};

    const fetchOptions = {
      body: JSON.stringify({
        query: print(operation.query),
        variables: operation.variables,
      }),
      method: 'POST',
      ...extraOptions,
      headers: {
        'content-type': 'application/json',
        ...extraOptions.headers,
      },
      signal:
        abortController !== undefined ? abortController.signal : undefined,
    };

    const startTime = Date.now();
    executeFetch(operation, fetchOptions).then(result => {
      if (result !== undefined) {
        next({
          ...result,
          operation: {
            ...result.operation,
            context: {
              ...result.operation.context,
              latency: Date.now() - startTime,
            },
          },
        });
      }

      complete();
    });

    return () => {
      if (abortController !== undefined) {
        abortController.abort();
      }
    };
  });
};

const executeFetch = (operation: Operation, opts: RequestInit) => {
  let response: Response | undefined;
  const { url } = operation.context;

  return fetch(url, opts)
    .then(res => {
      response = res;
      checkStatus(opts.redirect, response);
      return response.json();
    })
    .then(result => ({
      operation,
      data: result.data,
      error: Array.isArray(result.errors)
        ? new CombinedError({
            graphQLErrors: result.errors,
            response,
          })
        : undefined,
    }))
    .catch(err => {
      if (err.name === 'AbortError') {
        return undefined;
      }

      return {
        operation,
        data: undefined,
        error: new CombinedError({
          networkError: err,
          response,
        }),
      };
    });
};

const checkStatus = (redirectMode: string = 'follow', response: Response) => {
  const statusRangeEnd = redirectMode === 'manual' ? 400 : 300;

  if (response.status < 200 || response.status > statusRangeEnd) {
    throw new Error(response.statusText);
  }
};

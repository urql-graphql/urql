/* eslint-disable @typescript-eslint/no-use-before-define */
import { print } from 'graphql';
import { filter, make, merge, mergeMap, pipe, share, takeUntil } from 'wonka';
import { Exchange, Operation, OperationResult, RequestBuilder } from '../types';
import { addMetadata, CombinedError } from '../utils';

/** A higher-order function to create a custom exchange for fetching */
export const createFetchExchange = (
  buildRequest: RequestBuilder
): Exchange => ({ forward }) => {
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
          createFetchSource(operation, buildRequest),
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

/** A default exchange for fetching GraphQL requests. */
export const fetchExchange = createFetchExchange(operation => {
  const { context } = operation;

  const extraOptions =
    typeof context.fetchOptions === 'function'
      ? context.fetchOptions()
      : context.fetchOptions || {};

  return {
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
  };
});

const createFetchSource = (
  operation: Operation,
  buildRequest: RequestBuilder
) => {
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

    const fetchOptions = {
      ...buildRequest(operation),
      signal:
        abortController !== undefined ? abortController.signal : undefined,
    };

    const startTime = Date.now();

    executeFetch(operation, fetchOptions).then(result => {
      if (result !== undefined) {
        next({
          ...result,
          operation: addMetadata(result.operation, {
            networkLatency: Date.now() - startTime,
          }),
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
  const { url, fetch: fetcher } = operation.context;

  return (fetcher || fetch)(url, opts)
    .then(res => {
      response = res;
      checkStatus(opts.redirect, res);
      return res.json();
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
      extensions:
        typeof result.extensions === 'object' && result.extensions !== null
          ? result.extensions
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
        extensions: undefined,
      };
    });
};

const checkStatus = (redirectMode: string = 'follow', response: Response) => {
  const statusRangeEnd = redirectMode === 'manual' ? 400 : 300;

  if (response.status < 200 || response.status >= statusRangeEnd) {
    throw new Error(response.statusText);
  }
};

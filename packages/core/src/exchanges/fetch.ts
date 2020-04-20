/* eslint-disable @typescript-eslint/no-use-before-define */
import { Kind, DocumentNode, OperationDefinitionNode, print } from 'graphql';
import { filter, make, merge, mergeMap, pipe, share, takeUntil } from 'wonka';
import { Exchange, Operation, OperationResult, ExchangeInput } from '../types';
import { makeResult, makeErrorResult } from '../utils';

interface Body {
  query: string;
  variables: void | object;
  operationName?: string;
}

/** A default exchange for fetching GraphQL requests. */
export const fetchExchange: Exchange = ({ forward, dispatchDebug }) => {
  return ops$ => {
    const sharedOps$ = share(ops$);
    const fetchResults$ = pipe(
      sharedOps$,
      filter(operation => {
        return (
          operation.operationName === 'query' ||
          operation.operationName === 'mutation'
        );
      }),
      mergeMap(operation => {
        const { key } = operation;
        const teardown$ = pipe(
          sharedOps$,
          filter(op => op.operationName === 'teardown' && op.key === key)
        );

        return pipe(
          createFetchSource(
            operation,
            operation.operationName === 'query' &&
              !!operation.context.preferGetMethod,
            dispatchDebug
          ),
          takeUntil(teardown$)
        );
      })
    );

    const forward$ = pipe(
      sharedOps$,
      filter(operation => {
        return (
          operation.operationName !== 'query' &&
          operation.operationName !== 'mutation'
        );
      }),
      forward
    );

    return merge([fetchResults$, forward$]);
  };
};

const getOperationName = (query: DocumentNode): string | null => {
  const node = query.definitions.find(
    (node: any): node is OperationDefinitionNode => {
      return node.kind === Kind.OPERATION_DEFINITION && node.name;
    }
  );

  return node ? node.name!.value : null;
};

const createFetchSource = (
  operation: Operation,
  shouldUseGet: boolean,
  dispatchDebug: ExchangeInput['dispatchDebug']
) => {
  return make<OperationResult>(({ next, complete }) => {
    const abortController =
      typeof AbortController !== 'undefined'
        ? new AbortController()
        : undefined;

    const { context } = operation;

    const extraOptions =
      typeof context.fetchOptions === 'function'
        ? context.fetchOptions()
        : context.fetchOptions || {};

    const operationName = getOperationName(operation.query);

    const body: Body = {
      query: print(operation.query),
      variables: operation.variables,
    };

    if (operationName !== null) {
      body.operationName = operationName;
    }

    const fetchOptions = {
      ...extraOptions,
      body: shouldUseGet ? undefined : JSON.stringify(body),
      method: shouldUseGet ? 'GET' : 'POST',
      headers: {
        'content-type': 'application/json',
        ...extraOptions.headers,
      },
      signal:
        abortController !== undefined ? abortController.signal : undefined,
    };

    if (shouldUseGet) {
      operation.context.url = convertToGet(operation.context.url, body);
    }

    let ended = false;

    Promise.resolve()
      .then(() =>
        ended ? undefined : executeFetch(operation, fetchOptions, dispatchDebug)
      )
      .then((result: OperationResult | undefined) => {
        if (!ended) {
          ended = true;
          if (result) next(result);
          complete();
        }
      });

    return () => {
      ended = true;
      if (abortController !== undefined) {
        abortController.abort();
      }
    };
  });
};

const executeFetch = (
  operation: Operation,
  opts: RequestInit,
  dispatchDebug: ExchangeInput['dispatchDebug']
): Promise<OperationResult> => {
  const { url, fetch: fetcher } = operation.context;
  let statusNotOk = false;
  let response: Response;

  dispatchDebug({
    type: 'fetchRequest',
    message: 'A fetch request is being executed.',
    operation,
    data: {
      url,
      fetchOptions: opts,
    },
  });

  return (fetcher || fetch)(url, opts)
    .then((res: Response) => {
      response = res;
      statusNotOk =
        res.status < 200 ||
        res.status >= (opts.redirect === 'manual' ? 400 : 300);
      return res.json();
    })
    .then((result: any) => {
      if (!('data' in result) && !('errors' in result)) {
        throw new Error('No Content');
      }

      dispatchDebug({
        type: result.errors && !result.data ? 'fetchError' : 'fetchSuccess',
        message: `A ${
          result.errors ? 'failed' : 'successful'
        } fetch response has been returned.`,
        operation,
        data: {
          url,
          fetchOptions: opts,
          value: result,
        },
      });

      return makeResult(operation, result, response);
    })
    .catch((error: Error) => {
      if (error.name !== 'AbortError') {
        dispatchDebug({
          type: 'fetchError',
          message: error.name,
          operation,
          data: {
            url,
            fetchOptions: opts,
            value: error,
          },
        });

        return makeErrorResult(
          operation,
          statusNotOk ? new Error(response.statusText) : error,
          response
        );
      }
    }) as Promise<OperationResult>;
};

export const convertToGet = (uri: string, body: Body): string => {
  const queryParams: string[] = [`query=${encodeURIComponent(body.query)}`];

  if (body.variables) {
    queryParams.push(
      `variables=${encodeURIComponent(JSON.stringify(body.variables))}`
    );
  }

  return uri + '?' + queryParams.join('&');
};

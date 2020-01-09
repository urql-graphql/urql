/* eslint-disable @typescript-eslint/no-use-before-define */
import { Kind, DocumentNode, OperationDefinitionNode, print } from 'graphql';
import { filter, make, merge, mergeMap, pipe, share, takeUntil } from 'wonka';
import { Exchange, Operation, OperationResult } from '../types';
import { makeResult, makeErrorResult } from '../utils';

interface Body {
  query: string;
  variables: void | object;
  operationName?: string;
}

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

        return pipe(createFetchSource(operation), takeUntil(teardown$));
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

const getOperationName = (query: DocumentNode): string | null => {
  const node = query.definitions.find(
    (node: any): node is OperationDefinitionNode => {
      return node.kind === Kind.OPERATION_DEFINITION && node.name;
    }
  );

  return node !== undefined && node.name ? node.name.value : null;
};

const createFetchSource = (operation: Operation) => {
  if (
    process.env.NODE_ENV !== 'production' &&
    operation.operationName === 'subscription'
  ) {
    throw new Error(
      'Received a subscription operation in the httpExchange. You are probably trying to create a subscription. Have you added a subscriptionExchange?'
    );
  }

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
      body: JSON.stringify(body),
      method: 'POST',
      ...extraOptions,
      headers: {
        'content-type': 'application/json',
        ...extraOptions.headers,
      },
      signal:
        abortController !== undefined ? abortController.signal : undefined,
    };

    executeFetch(operation, fetchOptions).then(result => {
      if (result !== undefined) {
        next(result);
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
  const { url, fetch: fetcher } = operation.context;

  let response: Response | undefined;

  return (fetcher || fetch)(url, opts)
    .then(res => {
      const { status } = res;
      const statusRangeEnd = opts.redirect === 'manual' ? 400 : 300;
      response = res;

      if (status < 200 || status >= statusRangeEnd) {
        throw new Error(res.statusText);
      } else {
        return res.json();
      }
    })
    .then(result => makeResult(operation, result, response))
    .catch(err => {
      if (err.name !== 'AbortError') {
        return makeErrorResult(operation, err, response);
      }
    });
};

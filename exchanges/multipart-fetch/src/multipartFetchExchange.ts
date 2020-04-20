import { Kind, DocumentNode, OperationDefinitionNode } from 'graphql';
import { filter, make, merge, mergeMap, pipe, share, takeUntil } from 'wonka';
import { extractFiles } from 'extract-files';

import {
  ExchangeInput,
  Exchange,
  Operation,
  OperationResult,
  makeResult,
  makeErrorResult,
} from '@urql/core';
import {
  makeFetchBody,
  makeFetchURL,
  makeFetchOptions,
} from '@urql/core/internal';

interface Body {
  query: string;
  variables: void | object;
  operationName?: string;
}

const isOperationFetchable = (operation: Operation) =>
  operation.operationName === 'query' || operation.operationName === 'mutation';

export const multipartFetchExchange: Exchange = ({
  forward,
  dispatchDebug,
}) => ops$ => {
  const sharedOps$ = share(ops$);

  const fetchResults$ = pipe(
    sharedOps$,
    filter(isOperationFetchable),
    mergeMap(operation => {
      const teardown$ = pipe(
        sharedOps$,
        filter(
          op => op.operationName === 'teardown' && op.key === operation.key
        )
      );

      return pipe(
        createFetchSource(operation, dispatchDebug),
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

const createFetchSource = (
  operation: Operation,
  dispatchDebug: ExchangeInput['dispatchDebug']
) => {
  return make<OperationResult>(({ next, complete }) => {
    const abortController =
      typeof AbortController !== 'undefined'
        ? new AbortController()
        : undefined;

    // Spreading operation.variables here in case someone made a variables with Object.create(null).
    const { files, clone } = extractFiles({ ...operation.variables });

    const body = makeFetchBody(operation);
    operation.context.url = makeFetchURL(operation, body);
    const fetchOptions = makeFetchOptions(operation, body);

    if (!!files.size) {
      fetchOptions.body = new FormData();
      fetchOptions.method = 'POST';
      // Make fetch auto-append this for correctness
      delete fetchOptions.headers['content-type'];

      fetchOptions.body.append(
        'operations',
        JSON.stringify({
          ...body,
          variables: clone,
        })
      );

      const map = {};
      let i = 0;
      files.forEach(paths => {
        map[++i] = paths.map(path => `variables.${path}`);
      });
      fetchOptions.body.append('map', JSON.stringify(map));

      i = 0;
      files.forEach((_, file) => {
        (fetchOptions.body as FormData).append(`${++i}`, file, file.name);
      });
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
    });
};

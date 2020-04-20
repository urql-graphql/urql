import { filter, merge, mergeMap, pipe, share, takeUntil, onPush } from 'wonka';
import { extractFiles } from 'extract-files';
import { Exchange } from '@urql/core';

import {
  makeFetchBody,
  makeFetchURL,
  makeFetchOptions,
  makeFetchSource,
} from '@urql/core/internal';

export const multipartFetchExchange: Exchange = ({
  forward,
  dispatchDebug,
}) => ops$ => {
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
      const teardown$ = pipe(
        sharedOps$,
        filter(
          op => op.operationName === 'teardown' && op.key === operation.key
        )
      );

      // Spreading operation.variables here in case someone made a variables with Object.create(null).
      const { files, clone: variables } = extractFiles({
        ...operation.variables,
      });
      const body = makeFetchBody({ query: operation.query, variables });

      let url: string;
      let fetchOptions: RequestInit;
      if (files.size) {
        url = makeFetchURL(operation);
        fetchOptions = makeFetchOptions(operation);
        if (fetchOptions.headers!['content-type'] === 'application/json') {
          delete fetchOptions.headers!['content-type'];
        }

        fetchOptions.method = 'POST';
        fetchOptions.body = new FormData();
        fetchOptions.body.append('operations', JSON.stringify(body));
      } else {
        fetchOptions = makeFetchOptions(operation, body);
        url = makeFetchURL(operation, body);
      }

      dispatchDebug({
        type: 'fetchRequest',
        message: 'A fetch request is being executed.',
        operation,
        data: {
          url,
          fetchOptions,
        },
      });

      return pipe(
        makeFetchSource(operation, url, fetchOptions),
        takeUntil(teardown$),
        onPush(result => {
          const error = !result.data ? result.error : undefined;

          dispatchDebug({
            type: error ? 'fetchError' : 'fetchSuccess',
            message: `A ${
              error ? 'failed' : 'successful'
            } fetch response has been returned.`,
            operation,
            data: {
              url,
              fetchOptions,
              value: error || result,
            },
          });
        })
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

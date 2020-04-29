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
          if (!result.data && result.error && result.error.networkError) {
            dispatchDebug({
              type: 'fetchError',
              message: 'A failed fetch response has been returned.',
              operation,
              data: {
                url,
                fetchOptions,
                value: result.error.networkError,
              },
            });
          } else {
            dispatchDebug({
              type: 'fetchSuccess',
              message: 'A successful fetch response has been returned.',
              operation,
              data: {
                url,
                fetchOptions,
                value: {
                  data: result.data,
                  errors: result.error ? result.error.graphQLErrors : undefined,
                  extensions: result.extensions,
                },
              },
            });
          }
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

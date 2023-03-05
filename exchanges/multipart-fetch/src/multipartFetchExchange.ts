import { filter, merge, mergeMap, pipe, share, takeUntil, onPush } from 'wonka';
import { extractFiles } from 'extract-files';
import { Exchange } from '@urql/core';

import {
  makeFetchBody,
  makeFetchURL,
  makeFetchOptions,
  makeFetchSource,
} from '@urql/core/internal';

export interface MultipartFetchExchangeOpts {
  customFileCheck?: (maybeFile: unknown | undefined) => boolean;
}

export const multipartFetchExchangeWithOptions = ({
  customFileCheck,
}: MultipartFetchExchangeOpts = {}): Exchange => ({
  forward,
  dispatchDebug,
}) => ops$ => {
  const sharedOps$ = share(ops$);
  const fetchResults$ = pipe(
    sharedOps$,
    filter(operation => {
      return operation.kind === 'query' || operation.kind === 'mutation';
    }),
    mergeMap(operation => {
      const teardown$ = pipe(
        sharedOps$,
        filter(op => op.kind === 'teardown' && op.key === operation.key)
      );

      // Spreading operation.variables here in case someone made a variables with Object.create(null).
      const { files, clone: variables } = extractFiles(
        {
          ...operation.variables,
        },
        '',
        customFileCheck
      );
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
        url = makeFetchURL(operation, body);
        fetchOptions = makeFetchOptions(operation, body);
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
      return operation.kind !== 'query' && operation.kind !== 'mutation';
    }),
    forward
  );

  return merge([fetchResults$, forward$]);
};

export const multipartFetchExchange: Exchange = multipartFetchExchangeWithOptions();

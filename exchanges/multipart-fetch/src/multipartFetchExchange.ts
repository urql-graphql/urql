import { filter, merge, mergeMap, pipe, takeUntil, onPush } from 'wonka';
import { extractFiles } from 'extract-files';
import { Exchange } from '@urql/core';

import {
  makeFetchBody,
  makeFetchURL,
  makeFetchOptions,
  makeFetchSource,
} from '@urql/core/internal';

/** An Exchange which creates a multipart request when File/Blobs are found in variables.
 * @deprecated
 * `@urql/core` now supports the GraphQL Multipart Request spec out-of-the-box.
 */
export const multipartFetchExchange: Exchange =
  ({ forward, dispatchDebug }) =>
  operations$ => {
    const fetchResults$ = pipe(
      operations$,
      filter(operation => {
        return operation.kind === 'query' || operation.kind === 'mutation';
      }),
      mergeMap(operation => {
        const teardown$ = pipe(
          operations$,
          filter(op => op.kind === 'teardown' && op.key === operation.key)
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
          if (!(fetchOptions.body instanceof FormData)) {
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
          }
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
      operations$,
      filter(operation => {
        return operation.kind !== 'query' && operation.kind !== 'mutation';
      }),
      forward
    );

    return merge([fetchResults$, forward$]);
  };

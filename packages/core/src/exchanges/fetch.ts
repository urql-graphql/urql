/* eslint-disable @typescript-eslint/no-use-before-define */
import { filter, merge, mergeMap, pipe, takeUntil, onPush } from 'wonka';

import { Exchange } from '../types';
import {
  makeFetchBody,
  makeFetchURL,
  makeFetchOptions,
  makeFetchSource,
} from '../internal';

/** Default GraphQL over HTTP fetch exchange.
 *
 * @remarks
 * The default fetch exchange in `urql` supports sending GraphQL over HTTP
 * requests, can optionally send GraphQL queries as GET requests, and
 * handles incremental multipart responses.
 *
 * This exchange does not handle persisted queries or multipart uploads.
 * Support for the former can be added using `@urql/exchange-persisted-fetch`
 * and the latter using `@urql/exchange-multipart-fetch`.
 *
 * Hint: The `fetchExchange` and the two other exchanges all use the built-in fetch
 * utilities in `@urql/core/internal`, which you can also use to implement
 * a customized fetch exchange.
 *
 * @see {@link makeFetchSource} for the shared utility calling the Fetch API.
 */
export const fetchExchange: Exchange = ({ forward, dispatchDebug }) => {
  return ops$ => {
    const fetchResults$ = pipe(
      ops$,
      filter(operation => {
        return (
          operation.kind !== 'teardown' &&
          (operation.kind !== 'subscription' ||
            !!operation.context.fetchSubscriptions)
        );
      }),
      mergeMap(operation => {
        const body = makeFetchBody(operation);
        const url = makeFetchURL(operation, body);
        const fetchOptions = makeFetchOptions(operation, body);

        dispatchDebug({
          type: 'fetchRequest',
          message: 'A fetch request is being executed.',
          operation,
          data: {
            url,
            fetchOptions,
          },
        });

        const source = pipe(
          makeFetchSource(operation, url, fetchOptions),
          takeUntil(
            pipe(
              ops$,
              filter(op => op.kind === 'teardown' && op.key === operation.key)
            )
          )
        );

        if (process.env.NODE_ENV !== 'production') {
          return pipe(
            source,
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
        }

        return source;
      })
    );

    const forward$ = pipe(
      ops$,
      filter(operation => {
        return (
          operation.kind === 'teardown' ||
          (operation.kind === 'subscription' &&
            !operation.context.fetchSubscriptions)
        );
      }),
      forward
    );

    return merge([fetchResults$, forward$]);
  };
};

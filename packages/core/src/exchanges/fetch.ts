/* eslint-disable @typescript-eslint/no-use-before-define */
import { filter, merge, mergeMap, pipe, share, takeUntil, onPush } from 'wonka';

import { Exchange } from '../types';
import {
  makeFetchBody,
  makeFetchURL,
  makeFetchOptions,
  makeFetchSource,
} from '../internal';

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
                    errors: result.error
                      ? result.error.graphQLErrors
                      : undefined,
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
};

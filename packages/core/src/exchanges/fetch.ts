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
        return operation.kind === 'query' || operation.kind === 'mutation';
      }),
      mergeMap(operation => {
        const { key } = operation;
        const teardown$ = pipe(
          sharedOps$,
          filter(op => op.kind === 'teardown' && op.key === key)
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
};

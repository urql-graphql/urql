/* eslint-disable @typescript-eslint/no-use-before-define */
import { filter, merge, mergeMap, pipe, share, takeUntil } from 'wonka';

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

        return pipe(
          makeFetchSource(operation, url, fetchOptions, dispatchDebug),
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

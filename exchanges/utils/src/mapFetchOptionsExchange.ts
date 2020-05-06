import { Exchange, Operation } from '@urql/core';
import { pipe, mergeMap, map, fromPromise, fromValue } from 'wonka';

type FetchOptions = RequestInit | (() => RequestInit);

export const mapFetchOptionsExchange = (
  fn: (fetchOptions?: FetchOptions) => Promise<FetchOptions> | FetchOptions
): Exchange => ({ forward }) => ops$ => {
  return pipe(
    ops$,
    mergeMap((operation: Operation) => {
      const result = fn(operation.context.fetchOptions);
      return pipe(
        typeof (result as any).then === 'function'
          ? fromPromise(result as Promise<RequestInit>)
          : fromValue(result as RequestInit),
        map((fetchOptions: FetchOptions) => ({
          ...operation,
          context: { ...operation.context, fetchOptions },
        }))
      );
    }),
    forward
  );
};

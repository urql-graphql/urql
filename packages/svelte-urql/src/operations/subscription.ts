import { OperationContext, CombinedError, createRequest } from '@urql/core';
import { pipe, fromValue, concat, scan, map, subscribe } from 'wonka';
import { Readable } from 'svelte/store';
import { DocumentNode } from 'graphql';

import { getClient } from '../context';
import { initialState, batchReadable } from './utils';

export interface SubscriptionArguments<V> {
  query: string | DocumentNode;
  variables?: V;
  context?: Partial<OperationContext>;
}

export type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;

export interface SubscriptionResult<T> {
  fetching: boolean;
  stale: boolean;
  data?: T;
  error?: CombinedError;
  extensions?: Record<string, any>;
}

export const subscription = <T = any, R = T, V = object>(
  args: SubscriptionArguments<V>,
  handler?: SubscriptionHandler<T, R>
): Readable<SubscriptionResult<T>> => {
  const client = getClient();
  const request = createRequest(args.query, args.variables as any);

  const queryResult$ = pipe(
    concat([
      fromValue({ fetching: true, stale: false }),
      pipe(
        client.executeSubscription(request, args.context),
        map(({ stale, data, error, extensions }) => ({
          fetching: false,
          stale: !!stale,
          data,
          error,
          extensions,
        }))
      ),
      fromValue({ fetching: false, stale: false }),
    ]),
    scan((result, partial: any) => {
      const data =
        partial.data !== undefined
          ? typeof handler === 'function'
            ? handler(result.data, partial.data)
            : partial.data
          : result.data;
      return { ...result, ...partial, data };
    }, initialState)
  );

  return batchReadable({
    subscribe(onValue) {
      const { unsubscribe } = pipe(queryResult$, subscribe(onValue));
      return unsubscribe as () => void;
    },
  });
};

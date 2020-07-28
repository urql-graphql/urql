import {
  pipe,
  makeSubject,
  fromValue,
  switchMap,
  onStart,
  concat,
  scan,
  map,
  share,
  subscribe,
  publish,
} from 'wonka';

import { OperationContext, CombinedError, Operation } from '@urql/core';
import { Readable } from 'svelte/store';
import { DocumentNode } from 'graphql';

import { getClient } from '../context';
import { initialState } from './constants';

export interface SubscriptionArguments<V> {
  query: string | DocumentNode;
  variables?: V;
  pause?: boolean;
  context?: Partial<OperationContext>;
  operation?: Operation;
}

export type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;

export interface SubscriptionResult<T> {
  fetching: boolean;
  stale: boolean;
  data?: T;
  error?: CombinedError;
  extensions?: Record<string, any>;
}

export interface SubscriptionStore<T = any, R = T, V = object>
  extends Readable<SubscriptionResult<T>> {
  (args?: Partial<SubscriptionArguments<V>>): SubscriptionStore<T, R, V>;
}

export const subscription = <T = any, R = T, V = object>(
  args: SubscriptionArguments<V>,
  handler?: SubscriptionHandler<T, R>
): SubscriptionStore<T, R, V> => {
  const client = getClient();
  const { source: args$, next: nextArgs } = makeSubject<
    SubscriptionArguments<V>
  >();

  const subscriptionResult$ = pipe(
    args$,
    switchMap(args => {
      if (args.pause) {
        return fromValue({ fetching: false, stale: false });
      }

      return concat([
        // Initially set fetching to true
        fromValue({ fetching: true, stale: false }),
        pipe(
          client.subscription<T>(args.query, args.variables, args.context),
          map(({ stale, data, error, extensions, operation }) => ({
            fetching: false,
            stale: !!stale,
            data,
            error,
            extensions,
            operation,
          }))
        ),
        // When the source proactively closes, fetching is set to false
        fromValue({ fetching: false, stale: false }),
      ]);
    }),
    // The individual partial results are merged into each previous result
    scan((result, partial: any) => {
      const data =
        partial.data !== undefined
          ? typeof handler === 'function'
            ? handler(result.data, partial.data)
            : partial.data
          : result.data;
      return { ...result, ...partial, data };
    }, initialState),
    share
  );

  publish(subscriptionResult$);

  const subscriptionStore = (
    baseArgs: SubscriptionArguments<V>
  ): SubscriptionStore<T, R, V> => {
    function subscription$(args?: Partial<SubscriptionArguments<V>>) {
      return subscriptionStore({
        ...baseArgs,
        ...args,
      });
    }

    subscription$.subscribe = (
      onValue: (result: SubscriptionResult<T>) => void
    ) => {
      return pipe(
        subscriptionResult$,
        onStart(() => {
          nextArgs({ ...baseArgs, ...args });
        }),
        subscribe(onValue)
      ).unsubscribe;
    };

    return subscription$ as any;
  };

  return subscriptionStore(args);
};

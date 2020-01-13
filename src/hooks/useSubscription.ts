import { DocumentNode } from 'graphql';
import { useCallback, useRef, useMemo } from 'react';
import { pipe, concat, fromValue, switchMap, map, scan } from 'wonka';
import { useOperator } from 'react-wonka';

import { useClient } from '../context';
import { CombinedError } from '../utils';
import { OperationContext } from '../types';
import { useRequest } from './useRequest';
import { initialState } from './constants';

export interface UseSubscriptionArgs<V> {
  query: DocumentNode | string;
  variables?: V;
  pause?: boolean;
  context?: Partial<OperationContext>;
}

export type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;

export interface UseSubscriptionState<T> {
  fetching: boolean;
  stale: boolean;
  data?: T;
  error?: CombinedError;
  extensions?: Record<string, any>;
}

export type UseSubscriptionResponse<T> = [
  UseSubscriptionState<T>,
  (opts?: Partial<OperationContext>) => void
];

export const useSubscription = <T = any, R = T, V = object>(
  args: UseSubscriptionArgs<V>,
  handler?: SubscriptionHandler<T, R>
): UseSubscriptionResponse<R> => {
  const client = useClient();

  // Update handler on constant ref, since handler changes shouldn't
  // trigger a new subscription run
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  // This creates a request which will keep a stable reference
  // if request.key doesn't change
  const request = useRequest(args.query, args.variables);

  // Create a new subscription-source from client.executeSubscription
  const makeSubscription$ = useCallback(
    (opts?: Partial<OperationContext>) => {
      return client.executeSubscription(request, { ...args.context, ...opts });
    },
    [client, request, args.context]
  );

  const [state, update] = useOperator(
    subscription$$ =>
      pipe(
        subscription$$,
        switchMap(subscription$ => {
          if (!subscription$) return fromValue({ fetching: false });

          return concat([
            // Initially set fetching to true
            fromValue({ fetching: true }),
            pipe(
              subscription$,
              map(({ stale, data, error, extensions }) => ({
                fetching: true,
                stale: !!stale,
                data,
                error,
                extensions,
              }))
            ),
            // When the source proactively closes, fetching is set to false
            fromValue({ fetching: false }),
          ]);
        }),
        // The individual partial results are merged into each previous result
        scan((result, partial: any) => {
          const { current: handler } = handlerRef;
          // If a handler has been passed, it's used to merge new data in
          const data =
            partial.data !== undefined
              ? typeof handler === 'function'
                ? handler(result.data, partial.data)
                : partial.data
              : result.data;
          return { ...result, stale: false, ...partial, data };
        }, initialState)
      ),
    useMemo(() => (args.pause ? null : makeSubscription$()), [
      args.pause,
      makeSubscription$,
    ]),
    initialState
  );

  // This is the imperative execute function passed to the user
  const executeSubscription = useCallback(
    (opts?: Partial<OperationContext>) => update(makeSubscription$(opts)),
    [update, makeSubscription$]
  );

  return [state, executeSubscription];
};

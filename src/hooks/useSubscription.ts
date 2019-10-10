import { DocumentNode } from 'graphql';
import { useCallback, useRef, useMemo } from 'react';
import { pipe, concat, fromValue, switchMap, map, scan } from 'wonka';
import { useSubjectValue } from 'react-wonka';

import { useClient } from '../context';
import { CombinedError } from '../utils';
import { useRequest } from './useRequest';
import { GraphQLRequest, OperationContext } from '../types';

const initialState: UseSubscriptionState<any> = {
  fetching: false,
  data: undefined,
  error: undefined,
  extensions: undefined,
};

type InternalEvent = [
  GraphQLRequest,
  Partial<OperationContext>,
  undefined | boolean
];

export interface UseSubscriptionArgs<V> {
  query: DocumentNode | string;
  variables?: V;
  pause?: boolean;
  context?: Partial<OperationContext>;
}

export type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;

export interface UseSubscriptionState<T> {
  fetching: boolean;
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

  // A utility function to create a new context merged with `opts` and `args.context`
  const makeContext = useCallback(
    (opts?: Partial<OperationContext>) => ({
      ...args.context,
      ...opts,
    }),
    [args.context]
  );

  // Create an internal event with only the changes we care about
  const input = useMemo<InternalEvent>(
    () => [request, makeContext(), args.pause],
    [request, makeContext, args.pause]
  );

  const [state, update] = useSubjectValue(
    event$ =>
      pipe(
        event$,
        switchMap(([request, context, pause]: InternalEvent) => {
          // On pause fetching is reset to false
          if (pause) return fromValue({ fetching: false });

          return concat([
            // Initially set fetching to true
            fromValue({ fetching: true }),
            pipe(
              // Call executeSubscription and transform its result to the local state shape
              client.executeSubscription(request, context),
              map(({ data, error, extensions }) => ({
                fetching: true,
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
          if (partial.data !== undefined && typeof handler === 'function') {
            return {
              ...result,
              ...partial,
              data: handler(result.data, partial.data),
            };
          } else {
            return { ...result, ...partial };
          }
        }, initialState)
      ),
    input,
    initialState
  );

  // This is the imperative execute function passed to the user
  const executeSubscription = useCallback(
    (opts?: Partial<OperationContext>) =>
      update([request, makeContext(opts), false]),
    [makeContext, request, update]
  );

  return [state, executeSubscription];
};

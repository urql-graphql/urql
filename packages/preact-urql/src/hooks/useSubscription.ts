import { useEffect, useCallback, useRef, useMemo } from 'preact/hooks';
import { pipe, concat, fromValue, switchMap, map, scan } from 'wonka';

import {
  AnyVariables,
  GraphQLRequestParams,
  CombinedError,
  OperationContext,
  Operation,
} from '@urql/core';

import { useClient } from '../context';
import { useSource } from './useSource';
import { useRequest } from './useRequest';
import { initialState } from './constants';

export type UseSubscriptionArgs<
  Variables extends AnyVariables = AnyVariables,
  Data = any
> = {
  pause?: boolean;
  context?: Partial<OperationContext>;
} & GraphQLRequestParams<Data, Variables>;

export type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;

export interface UseSubscriptionState<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> {
  fetching: boolean;
  stale: boolean;
  data?: Data;
  error?: CombinedError;
  extensions?: Record<string, any>;
  operation?: Operation<Data, Variables>;
}

export type UseSubscriptionResponse<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> = [
  UseSubscriptionState<Data, Variables>,
  (opts?: Partial<OperationContext>) => void
];

export function useSubscription<
  Data = any,
  Result = Data,
  Variables extends AnyVariables = AnyVariables
>(
  args: UseSubscriptionArgs<Variables, Data>,
  handler?: SubscriptionHandler<Data, Result>
): UseSubscriptionResponse<Result, Variables> {
  const client = useClient();

  // Update handler on constant ref, since handler changes shouldn't
  // trigger a new subscription run
  const handlerRef = useRef(handler);
  handlerRef.current = handler!;

  // This creates a request which will keep a stable reference
  // if request.key doesn't change
  const request = useRequest(args.query, args.variables as Variables);

  // Create a new subscription-source from client.executeSubscription
  const makeSubscription$ = useCallback(
    (opts?: Partial<OperationContext>) => {
      return client.executeSubscription<Data, Variables>(request, {
        ...args.context,
        ...opts,
      });
    },
    [client, request, args.context]
  );

  const subscription$ = useMemo(() => {
    return args.pause ? null : makeSubscription$();
  }, [args.pause, makeSubscription$]);

  const [state, update] = useSource(
    subscription$,
    useCallback(
      (subscription$$, prevState?: UseSubscriptionState<Result, Variables>) => {
        return pipe(
          subscription$$,
          switchMap(subscription$ => {
            if (!subscription$) return fromValue({ fetching: false });

            return concat([
              // Initially set fetching to true
              fromValue({ fetching: true, stale: false }),
              pipe(
                subscription$,
                map(({ stale, data, error, extensions, operation }) => ({
                  fetching: true,
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
          scan(
            (result: UseSubscriptionState<Result, Variables>, partial: any) => {
              const { current: handler } = handlerRef;
              // If a handler has been passed, it's used to merge new data in
              const data =
                partial.data !== undefined
                  ? typeof handler === 'function'
                    ? handler(result.data, partial.data)
                    : partial.data
                  : result.data;
              return { ...result, ...partial, data };
            },
            prevState || initialState
          )
        );
      },
      []
    )
  );

  // This is the imperative execute function passed to the user
  const executeSubscription = useCallback(
    (opts?: Partial<OperationContext>) => update(makeSubscription$(opts)),
    [update, makeSubscription$]
  );

  useEffect(() => {
    update(subscription$);
  }, [update, subscription$]);

  return [state, executeSubscription];
}

/* eslint-disable react-hooks/exhaustive-deps */

import { pipe, subscribe, onEnd } from 'wonka';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';

import {
  GraphQLRequestParams,
  AnyVariables,
  CombinedError,
  OperationContext,
  Operation,
} from '@urql/core';

import { useClient } from '../context';
import { useRequest } from './useRequest';
import { initialState, computeNextState, hasDepsChanged } from './state';

/** Input arguments for the {@link useSubscription} hook.
 *
 * @param query - The GraphQL subscription document that `useSubscription` executes.
 * @param variables - The variables for the GraphQL subscription that `useSubscription` executes.
 */
export type UseSubscriptionArgs<
  Variables extends AnyVariables = AnyVariables,
  Data = any
> = {
  /** Prevents {@link useSubscription} from automatically starting GraphQL subscriptions.
   *
   * @remarks
   * `pause` may be set to `true` to stop {@link useSubscription} from starting its subscription
   * automatically. The hook will stop receiving updates from the {@link Client}
   * and won’t start the subscription operation, until either it’s set to `false`
   * or the {@link UseSubscriptionExecute} function is called.
   */
  pause?: boolean;
  /** Updates the {@link OperationContext} for the executed GraphQL subscription operation.
   *
   * @remarks
   * `context` may be passed to {@link useSubscription}, to update the {@link OperationContext}
   * of a subscription operation. This may be used to update the `context` that exchanges
   * will receive for a single hook.
   *
   * Hint: This should be wrapped in a `useMemo` hook, to make sure that your
   * component doesn’t infinitely update.
   *
   * @example
   * ```ts
   * const [result, reexecute] = useSubscription({
   *   query,
   *   context: useMemo(() => ({
   *     additionalTypenames: ['Item'],
   *   }), [])
   * });
   * ```
   */
  context?: Partial<OperationContext>;
} & GraphQLRequestParams<Data, Variables>;

/** Combines previous data with an incoming subscription result’s data.
 *
 * @remarks
 * A `SubscriptionHandler` may be passed to {@link useSubscription} to
 * aggregate subscription results into a combined {@link UseSubscriptionState.data}
 * value.
 *
 * This is useful when a subscription event delivers a single item, while
 * you’d like to display a list of events.
 *
 * @example
 * ```ts
 * const NotificationsSubscription = gql`
 *   subscription { newNotification { id, text } }
 * `;
 *
 * const combineNotifications = (notifications = [], data) => {
 *   return [...notifications, data.newNotification];
 * };
 *
 * const [result, executeSubscription] = useSubscription(
 *   { query: NotificationsSubscription },
 *   combineNotifications,
 * );
 * ```
 */
export type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;

/** State of the current subscription, your {@link useSubscription} hook is executing.
 *
 * @remarks
 * `UseSubscriptionState` is returned (in a tuple) by {@link useSubscription} and
 * gives you the updating {@link OperationResult} of GraphQL subscriptions.
 *
 * If a {@link SubscriptionHandler} has been passed to `useSubscription` then
 * {@link UseSubscriptionState.data} is instead the updated data as returned
 * by the handler, otherwise it’s the latest result’s data.
 *
 * Hint: Even when the query and variables passed to {@link useSubscription} change,
 * this state preserves the prior state.
 */
export interface UseSubscriptionState<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> {
  /** Indicates whether `useSubscription`’s subscription is active.
   *
   * @remarks
   * When `useSubscription` starts a subscription, the `fetching` flag
   * is set to `true` and will remain `true` until
   * start executing the new query operation and `fetching` is set to
   * `true` until the subscription completes on the API, or the
   * {@link UseSubscriptionArgs.pause} flag is set to `true`.
   */
  fetching: boolean;
  /** Indicates that the subscription result is not fresh.
   *
   * @remarks
   * This is mostly unused for subscriptions and will rarely affect you, and
   * is more relevant for queries.
   *
   * @see {@link OperationResult.stale} for the source of this value.
   */
  stale: boolean;
  /** The {@link OperationResult.data} for the executed subscription, or data returned by a handler.
   *
   * @remarks
   * `data` will be set to the last {@link OperationResult.data} value
   * received for the subscription.
   *
   * It will instead be set to the values that {@link SubscriptionHandler}
   * returned, if a handler has been passed to {@link useSubscription}.
   */
  data?: Data;
  /** The {@link OperationResult.error} for the executed subscription. */
  error?: CombinedError;
  /** The {@link OperationResult.extensions} for the executed mutation. */
  extensions?: Record<string, any>;
  /** The {@link Operation} that the current state is for.
   *
   * @remarks
   * This is the subscription {@link Operation} that is currently active.
   * When {@link UseQueryState.fetching} is `true`, this is the
   * last `Operation` that the current state was for.
   */
  operation?: Operation<Data, Variables>;
}

/** Triggers {@link useSubscription} to reexecute a GraphQL subscription operation.
 *
 * @param opts - optionally, context options that will be merged with the hook's
 * {@link UseSubscriptionArgs.context} options and the `Client`’s options.
 *
 * @remarks
 * When called, {@link useSubscription} will restart the GraphQL subscription
 * operation it currently holds. If {@link UseSubscriptionArgs.pause} is set
 * to `true`, it will start executing the subscription.
 *
 * ```ts
 * const [result, executeSubscription] = useSubscription({
 *   query,
 *   pause: true,
 * });
 *
 * const start = () => {
 *   executeSubscription();
 * };
 * ```
 */
export type UseSubscriptionExecute = (opts?: Partial<OperationContext>) => void;

/** Result tuple returned by the {@link useSubscription} hook.
 *
 * @remarks
 * Similarly to a `useState` hook’s return value,
 * the first element is the {@link useSubscription}’s state,
 * a {@link UseSubscriptionState} object,
 * and the second is used to imperatively re-execute or start the subscription
 * via a {@link UseMutationExecute} function.
 */
export type UseSubscriptionResponse<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> = [UseSubscriptionState<Data, Variables>, UseSubscriptionExecute];

/** Hook to run a GraphQL subscription and get updated GraphQL results.
 *
 * @param args - a {@link UseSubscriptionArgs} object, to pass a `query`, `variables`, and options.
 * @param handler - optionally, a {@link SubscriptionHandler} function to combine multiple subscription results.
 * @returns a {@link UseSubscriptionResponse} tuple of a {@link UseSubscriptionState} result, and an execute function.
 *
 * @remarks
 * `useSubscription` allows GraphQL subscriptions to be defined and executed.
 * Given {@link UseSubscriptionArgs.query}, it executes the GraphQL subscription with the
 * context’s {@link Client}.
 *
 * The returned result updates when the `Client` has new results
 * for the subscription, and `data` is updated with the result’s data
 * or with the `data` that a `handler` returns.
 *
 * @example
 * ```ts
 * import { gql, useSubscription } from 'urql';
 *
 * const NotificationsSubscription = gql`
 *   subscription { newNotification { id, text } }
 * `;
 *
 * const combineNotifications = (notifications = [], data) => {
 *   return [...notifications, data.newNotification];
 * };
 *
 * const Notifications = () => {
 *   const [result, executeSubscription] = useSubscription(
 *     { query: NotificationsSubscription },
 *     combineNotifications,
 *   );
 *   // ...
 * };
 * ```
 */
export function useSubscription<
  Data = any,
  Result = Data,
  Variables extends AnyVariables = AnyVariables
>(
  args: UseSubscriptionArgs<Variables, Data>,
  handler?: SubscriptionHandler<Data, Result>
): UseSubscriptionResponse<Result, Variables> {
  const client = useClient();
  const request = useRequest(args.query, args.variables as Variables);

  const handlerRef = useRef<SubscriptionHandler<Data, Result> | undefined>(
    handler
  );
  handlerRef.current = handler;

  const source = useMemo(
    () =>
      !args.pause ? client.executeSubscription(request, args.context) : null,
    [client, request, args.pause, args.context]
  );

  const deps = [client, request, args.context, args.pause] as const;

  const [state, setState] = useState(
    () => [source, { ...initialState, fetching: !!source }, deps] as const
  );

  let currentResult = state[1];
  if (source !== state[0] && hasDepsChanged(state[2], deps)) {
    setState([
      source,
      (currentResult = computeNextState(state[1], { fetching: !!source })),
      deps,
    ]);
  }

  useEffect(() => {
    const updateResult = (
      result: Partial<UseSubscriptionState<Data, Variables>>
    ) => {
      setState(state => {
        const nextResult = computeNextState(state[1], result);
        if (state[1] === nextResult) return state;
        if (handlerRef.current && state[1].data !== nextResult.data) {
          nextResult.data = handlerRef.current(
            state[1].data,
            nextResult.data!
          ) as any;
        }

        return [state[0], nextResult as any, state[2]];
      });
    };

    if (state[0]) {
      return pipe(
        state[0],
        onEnd(() => {
          updateResult({ fetching: !!source });
        }),
        subscribe(updateResult)
      ).unsubscribe;
    } else {
      updateResult({ fetching: false });
    }
  }, [state[0]]);

  // This is the imperative execute function passed to the user
  const executeSubscription = useCallback(
    (opts?: Partial<OperationContext>) => {
      const source = client.executeSubscription(request, {
        ...args.context,
        ...opts,
      });

      setState(state => [source, state[1], deps]);
    },
    [client, args.context, request]
  );

  return [currentResult, executeSubscription];
}

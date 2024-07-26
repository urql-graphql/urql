/* eslint-disable react-hooks/rules-of-hooks */

import { pipe, subscribe, onEnd } from 'wonka';

import type { Ref, WatchStopHandle } from 'vue';
import { isRef, ref, watchEffect } from 'vue';

import type {
  Client,
  GraphQLRequestParams,
  AnyVariables,
  CombinedError,
  OperationContext,
  Operation,
} from '@urql/core';

import { useClient } from './useClient';

import type { MaybeRef, MaybeRefObj } from './utils';
import { useRequestState, useClientState } from './utils';

/** Input arguments for the {@link useSubscription} function.
 *
 * @param query - The GraphQL subscription document that `useSubscription` executes.
 * @param variables - The variables for the GraphQL subscription that `useSubscription` executes.
 */
export type UseSubscriptionArgs<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
> = {
  /** Prevents {@link useSubscription} from automatically executing GraphQL subscription operations.
   *
   * @remarks
   * `pause` may be set to `true` to stop {@link useSubscription} from starting
   * its subscription automatically. This will pause the subscription until
   * {@link UseSubscriptionResponse.resume} is called, or, if `pause` is a reactive
   * ref of a boolean, until this ref changes to `true`.
   */
  pause?: MaybeRef<boolean>;
  /** Updates the {@link OperationContext} for the executed GraphQL subscription operation.
   *
   * @remarks
   * `context` may be passed to {@link useSubscription}, to update the {@link OperationContext}
   * of a subscription operation. This may be used to update the `context` that exchanges
   * will receive for a single hook.
   *
   * @example
   * ```ts
   * const result = useQuery({
   *   query,
   *   context: {
   *     additionalTypenames: ['Item'],
   *   },
   * });
   * ```
   */
  context?: MaybeRef<Partial<OperationContext>>;
} & MaybeRefObj<GraphQLRequestParams<Data, MaybeRefObj<Variables>>>;

/** Combines previous data with an incoming subscription result’s data.
 *
 * @remarks
 * A `SubscriptionHandler` may be passed to {@link useSubscription} to
 * aggregate subscription results into a combined {@link UseSubscriptionResponse.data}
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
 * const result = useSubscription(
 *   { query: NotificationsSubscription },
 *   combineNotifications,
 * );
 * ```
 */
export type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;

/** A {@link SubscriptionHandler} or a reactive ref of one. */
export type SubscriptionHandlerArg<T, R> =
  | Ref<SubscriptionHandler<T, R>>
  | SubscriptionHandler<T, R>;

/** State of the current query, your {@link useSubscription} function is executing.
 *
 * @remarks
 * `UseSubscriptionResponse` is returned by {@link useSubscription} and
 * gives you the updating {@link OperationResult} of GraphQL subscriptions.
 *
 * Each value that is part of the result is wrapped in a reactive ref
 * and updates as results come in.
 *
 * Hint: Even when the query and variables update, the prior state of
 * the last result is preserved.
 */
export interface UseSubscriptionResponse<
  T = any,
  R = T,
  V extends AnyVariables = AnyVariables,
> {
  /** Indicates whether `useSubscription`’s subscription is active.
   *
   * @remarks
   * When `useSubscription` starts a subscription, the `fetching` flag
   * is set to `true` and will remain `true` until the subscription
   * completes on the API, or `useSubscription` is paused.
   */
  fetching: Ref<boolean>;
  /** Indicates that the subscription result is not fresh.
   *
   * @remarks
   * This is mostly unused for subscriptions and will rarely affect you, and
   * is more relevant for queries.
   *
   * @see {@link OperationResult.stale} for the source of this value.
   */
  stale: Ref<boolean>;
  /** Reactive {@link OperationResult.data} for the executed subscription, or data returned by the handler.
   *
   * @remarks
   * `data` will be set to the last {@link OperationResult.data} value
   * received for the subscription.
   *
   * It will instead be set to the values that {@link SubscriptionHandler}
   * returned, if a handler has been passed to {@link useSubscription}.
   */
  data: Ref<R | undefined>;
  /** Reactive {@link OperationResult.error} for the executed subscription. */
  error: Ref<CombinedError | undefined>;
  /** Reactive {@link OperationResult.extensions} for the executed mutation. */
  extensions: Ref<Record<string, any> | undefined>;
  /** Reactive {@link Operation} that the current state is for.
   *
   * @remarks
   * This is the subscription {@link Operation} that is currently active.
   * When {@link UseSubscriptionResponse.fetching} is `true`, this is the
   * last `Operation` that the current state was for.
   */
  operation: Ref<Operation<T, V> | undefined>;
  /** Indicates whether {@link useSubscription} is currently paused.
   *
   * @remarks
   * When `useSubscription` has been paused, it will stop receiving updates
   * from the {@link Client} and won’t execute the subscription, until
   * {@link UseSubscriptionArgs.pause} becomes true or
   * {@link UseSubscriptionResponse.resume} is called.
   */
  isPaused: Ref<boolean>;
  /** Resumes {@link useSubscription} if it’s currently paused.
   *
   * @remarks
   * Resumes or starts {@link useSubscription}’s subscription, if it’s currently paused.
   */
  resume(): void;
  /** Pauses {@link useSubscription} to stop the subscription.
   *
   * @remarks
   * Pauses {@link useSubscription}’s subscription, which stops it
   * from receiving updates from the {@link Client} and to stop executing
   * the subscription operation.
   */
  pause(): void;
  /** Triggers {@link useQuery} to reexecute a GraphQL subscription operation.
   *
   * @param opts - optionally, context options that will be merged with
   * {@link UseQueryArgs.context} and the `Client`’s options.
   *
   * @remarks
   * When called, {@link useSubscription} will re-execute the GraphQL subscription
   * operation it currently holds, unless it’s currently paused.
   */
  executeSubscription(opts?: Partial<OperationContext>): void;
}

/** Function to run a GraphQL subscription and get reactive GraphQL results.
 *
 * @param args - a {@link UseSubscriptionArgs} object, to pass a `query`, `variables`, and options.
 * @param handler - optionally, a {@link SubscriptionHandler} function to combine multiple subscription results.
 * @returns a {@link UseSubscriptionResponse} object.
 *
 * @remarks
 * `useSubscription` allows GraphQL subscriptions to be defined and executed inside
 * Vue `setup` functions.
 * Given {@link UseSubscriptionArgs.query}, it executes the GraphQL subscription with the
 * provided {@link Client}.
 *
 * The returned result updates when the `Client` has new results
 * for the subscription, and `data` is updated with the result’s data
 * or with the `data` that a `handler` returns.
 *
 * @example
 * ```ts
 * import { gql, useSubscription } from '@urql/vue';
 *
 * const NotificationsSubscription = gql`
 *   subscription { newNotification { id, text } }
 * `;
 *
 * export default {
 *   setup() {
 *     const result = useSubscription(
 *       { query: NotificationsSubscription },
 *       function combineNotifications(notifications = [], data) {
 *         return [...notifications, data.newNotification];
 *       },
 *     );
 *     // ...
 *   },
 * };
 * ```
 */
export function useSubscription<
  T = any,
  R = T,
  V extends AnyVariables = AnyVariables,
>(
  args: UseSubscriptionArgs<T, V>,
  handler?: SubscriptionHandlerArg<T, R>
): UseSubscriptionResponse<T, R, V> {
  return callUseSubscription(args, handler);
}

export function callUseSubscription<
  T = any,
  R = T,
  V extends AnyVariables = AnyVariables,
>(
  args: UseSubscriptionArgs<T, V>,
  handler?: SubscriptionHandlerArg<T, R>,
  client: Ref<Client> = useClient(),
  stops?: WatchStopHandle[]
): UseSubscriptionResponse<T, R, V> {
  const data: Ref<R | undefined> = ref();

  const { fetching, operation, extensions, stale, error } = useRequestState<
    T,
    V
  >();

  const { isPaused, source, pause, resume, execute, teardown } = useClientState(
    args,
    client,
    'executeSubscription'
  );

  const teardownSubscription = watchEffect(onInvalidate => {
    if (source.value) {
      fetching.value = true;

      onInvalidate(
        pipe(
          source.value,
          onEnd(() => {
            fetching.value = false;
          }),
          subscribe(result => {
            fetching.value = true;
            error.value = result.error;
            extensions.value = result.extensions;
            stale.value = !!result.stale;
            operation.value = result.operation;

            if (result.data != null && handler) {
              const cb = isRef(handler) ? handler.value : handler;
              if (typeof cb === 'function') {
                data.value = cb(data.value, result.data);
                return;
              }
            }
            data.value = result.data as R;
          })
        ).unsubscribe
      );
    } else {
      fetching.value = false;
    }
  });

  stops && stops.push(teardown, teardownSubscription);

  const state: UseSubscriptionResponse<T, R, V> = {
    data,
    stale,
    error,
    operation,
    extensions,
    fetching,
    isPaused,
    pause,
    resume,
    executeSubscription(
      opts?: Partial<OperationContext>
    ): UseSubscriptionResponse<T, R, V> {
      execute(opts);
      return state;
    },
  };

  return state;
}

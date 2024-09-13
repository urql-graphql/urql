import { type MaybeAccessor, asAccessor } from './utils';
import {
  type AnyVariables,
  type DocumentInput,
  type Operation,
  type OperationContext,
  type OperationResult,
  type CombinedError,
  createRequest,
} from '@urql/core';
import { useClient } from './context';
import { createStore, produce } from 'solid-js/store';
import { createComputed, createSignal, onCleanup } from 'solid-js';
import { type Source, onEnd, pipe, subscribe } from 'wonka';

/** Triggers {@link createSubscription} to re-execute a GraphQL subscription operation.
 *
 * @param opts - optionally, context options that will be merged with the hook's
 * {@link CreateSubscriptionArgs.context} options and the `Client`’s options.
 *
 * @remarks
 * When called, {@link createSubscription} will restart the GraphQL subscription
 * operation it currently holds. If {@link CreateSubscriptionArgs.pause} is set
 * to `true`, it will start executing the subscription.
 *
 * ```ts
 * const [result, executeSubscription] = createSubscription({
 *   query,
 *   pause: true,
 * });
 *
 * const start = () => {
 *   executeSubscription();
 * };
 * ```
 */
export type CreateSubscriptionExecute = (
  opts?: Partial<OperationContext>
) => void;

/** Input arguments for the {@link createSubscription} hook. */
export type CreateSubscriptionArgs<
  Data,
  Variables extends AnyVariables = AnyVariables,
> = {
  /** The GraphQL subscription document that `createSubscription` executes. */
  query: DocumentInput<Data, Variables>;

  /** The variables for the GraphQL subscription that `createSubscription` executes. */
  variables?: MaybeAccessor<Variables>;

  /** Updates the {@link OperationContext} for the executed GraphQL subscription operation.
   *
   * @remarks
   * `context` may be passed to {@link createSubscription}, to update the {@link OperationContext}
   * of a subscription operation. This may be used to update the `context` that exchanges
   * will receive for a single hook.
   */
  context?: MaybeAccessor<Partial<OperationContext>>;

  /** Prevents {@link createSubscription} from automatically starting GraphQL subscriptions.
   *
   * @remarks
   * `pause` may be set to `true` to stop {@link createSubscription} from starting its subscription
   * automatically. The hook will stop receiving updates from the {@link Client}
   * and won’t start the subscription operation, until either it’s set to `false`
   * or the {@link CreateSubscriptionExecute} function is called.
   */
  pause?: MaybeAccessor<boolean>;
};

export type CreateSubscriptionState<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
> = {
  /** Indicates whether `createSubscription`’s subscription is active.
   *
   * @remarks
   * When `createSubscription` starts a subscription, the `fetching` flag
   * is set to `true` and will remain `true` until the subscription
   * completes on the API, or the {@link CreateSubscriptionArgs.pause}
   * flag is set to `true`.
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
   * returned, if a handler has been passed to {@link CreateSubscription}.
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
   * When {@link CreateSubscriptionState.fetching} is `true`, this is the
   * last `Operation` that the current state was for.
   */
  operation?: Operation<Data, Variables>;
};

/** Combines previous data with an incoming subscription result’s data.
 *
 * @remarks
 * A `SubscriptionHandler` may be passed to {@link createSubscription} to
 * aggregate subscription results into a combined {@link CreateSubscriptionState.data}
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
 * const [result, executeSubscription] = createSubscription(
 *   { query: NotificationsSubscription },
 *   combineNotifications,
 * );
 * ```
 */
export type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;

/** Result tuple returned by the {@link createSubscription} hook.
 *
 * @remarks
 * Similarly to a `createSignal` hook’s return value,
 * the first element is the {@link createSubscription}’s state,
 * a {@link CreateSubscriptionState} object,
 * and the second is used to imperatively re-execute or start the subscription
 * via a {@link CreateMutationExecute} function.
 */
export type CreateSubscriptionResult<
  Data,
  Variables extends AnyVariables = AnyVariables,
> = [CreateSubscriptionState<Data, Variables>, CreateSubscriptionExecute];

/** Hook to run a GraphQL subscription and get updated GraphQL results.
 *
 * @param args - a {@link CreateSubscriptionArgs} object, to pass a `query`, `variables`, and options.
 * @param handler - optionally, a {@link SubscriptionHandler} function to combine multiple subscription results.
 * @returns a {@link CreateSubscriptionResponse} tuple of a {@link CreateSubscriptionState} result,
 * and an execute function.
 *
 * @remarks
 * `createSubscription` allows GraphQL subscriptions to be defined and executed.
 * Given {@link CreateSubscriptionArgs.query}, it executes the GraphQL subscription with the
 * context’s {@link Client}.
 *
 * The returned result updates when the `Client` has new results
 * for the subscription, and `data` is updated with the result’s data
 * or with the `data` that a `handler` returns.
 *
 * @example
 * ```ts
 * import { gql, createSubscription } from '@urql/solid';
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
 *   const [result, executeSubscription] = createSubscription(
 *     { query: NotificationsSubscription },
 *     combineNotifications,
 *   );
 *   // ...
 * };
 * ```
 */
export const createSubscription = <
  Data,
  Result = Data,
  Variables extends AnyVariables = AnyVariables,
>(
  args: CreateSubscriptionArgs<Data, Variables>,
  handler?: SubscriptionHandler<Data, Result>
): CreateSubscriptionResult<Result, Variables> => {
  const getContext = asAccessor(args.context);
  const getPause = asAccessor(args.pause);
  const getVariables = asAccessor(args.variables);

  const client = useClient();

  const request = createRequest(args.query, getVariables() as Variables);
  const operation = client.createRequestOperation(
    'subscription',
    request,
    getContext()
  );
  const initialState: CreateSubscriptionState<Result, Variables> = {
    operation,
    fetching: false,
    data: undefined,
    error: undefined,
    extensions: undefined,
    stale: false,
  };

  const [source, setSource] = createSignal<
    Source<OperationResult<Data, Variables>> | undefined
  >(undefined, { equals: false });

  const [state, setState] =
    createStore<CreateSubscriptionState<Result, Variables>>(initialState);

  createComputed(() => {
    if (getPause() === true) {
      setSource(undefined);
      return;
    }

    const context = getContext();
    const request = createRequest(args.query, getVariables() as Variables);
    setSource(() => client.executeSubscription(request, context));
  });

  createComputed(() => {
    const s = source();
    if (s === undefined) {
      setState('fetching', false);

      return;
    }

    setState('fetching', true);
    onCleanup(
      pipe(
        s,
        onEnd(() => {
          setState(
            produce(draft => {
              draft.fetching = false;
            })
          );
        }),
        subscribe(res => {
          setState(
            produce(draft => {
              draft.data =
                res.data !== undefined
                  ? typeof handler === 'function'
                    ? handler(draft.data, res.data)
                    : res.data
                  : (draft.data as any);
              draft.stale = !!res.stale;
              draft.fetching = true;
              draft.error = res.error;
              draft.operation = res.operation;
              draft.extensions = res.extensions;
            })
          );
        })
      ).unsubscribe
    );
  });

  const executeSubscription = (opts?: Partial<OperationContext>) => {
    const context: Partial<OperationContext> = {
      ...getContext(),
      ...opts,
    };
    const request = createRequest(args.query, getVariables() as Variables);

    setSource(() => client.executeSubscription(request, context));
  };

  return [state, executeSubscription];
};

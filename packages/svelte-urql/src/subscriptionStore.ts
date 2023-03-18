import {
  AnyVariables,
  GraphQLRequestParams,
  Client,
  OperationContext,
  createRequest,
} from '@urql/core';

import {
  Source,
  pipe,
  map,
  fromValue,
  switchMap,
  subscribe,
  concat,
  scan,
  never,
} from 'wonka';

import { derived, writable } from 'svelte/store';

import {
  OperationResultState,
  OperationResultStore,
  Pausable,
  initialResult,
  createPausable,
  fromStore,
} from './common';

export type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;

/** Input arguments for the {@link subscriptionStore} function.
 *
 * @param query - The GraphQL subscription that the `subscriptionStore` executes.
 * @param variables - The variables for the GraphQL subscription that `subscriptionStore` executes.
 */
export type SubscriptionArgs<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> = {
  /** The {@link Client} using which the subscription will be started.
   *
   * @remarks
   * If you’ve previously provided a {@link Client} on Svelte’s context
   * this can be set to {@link getContextClient}’s return value.
   */
  client: Client;
  /** Updates the {@link OperationContext} for the GraphQL subscription operation.
   *
   * @remarks
   * `context` may be passed to {@link subscriptionStore}, to update the
   * {@link OperationContext} of a subscription operation. This may be used to update
   * the `context` that exchanges will receive for a single hook.
   *
   * @example
   * ```ts
   * subscriptionStore({
   *   query,
   *   context: {
   *     additionalTypenames: ['Item'],
   *   },
   * });
   * ```
   */
  context?: Partial<OperationContext>;
  /** Prevents the {@link subscriptionStore} from automatically starting the GraphQL subscription.
   *
   * @remarks
   * `pause` may be set to `true` to stop the {@link subscriptionStore} from starting
   * its subscription automatically. The store won't execute the subscription operation,
   * until either it’s set to `false` or {@link Pausable.resume} is called.
   */
  pause?: boolean;
} & GraphQLRequestParams<Data, Variables>;

/** Function to create a `subscriptionStore` that starts a GraphQL subscription.
 *
 * @param args - a {@link QueryArgs} object, to pass a `query`, `variables`, and options.
 * @returns a {@link OperationResultStore} of subscription results, which implements {@link Pausable}.
 *
 * @remarks
 * `subscriptionStore` allows GraphQL subscriptions to be defined as Svelte stores.
 * Given {@link SubscriptionArgs.query}, it executes the GraphQL subsription on the
 * {@link SubscriptionArgs.client}.
 *
 * The returned store updates with {@link OperationResult} values when
 * the `Client` has new results for the subscription.
 *
 * @see {@link https://urql.dev/goto/docs/advanced/subscriptions#svelte} for
 * `subscriptionStore` docs.
 *
 * @example
 * ```ts
 * import { subscriptionStore, gql, getContextClient } from '@urql/svelte';
 *
 * const todos = subscriptionStore({
 *   client: getContextClient(),
 *   query: gql`
 *     subscription {
 *       newNotification { id, text }
 *     }
 *   `,
 * });
 * ```
 */
export function subscriptionStore<
  Data,
  Result = Data,
  Variables extends AnyVariables = AnyVariables
>(
  args: SubscriptionArgs<Data, Variables>,
  handler?: SubscriptionHandler<Data, Result>
): OperationResultStore<Result, Variables> & Pausable {
  const request = createRequest(args.query, args.variables as Variables);

  const operation = args.client.createRequestOperation(
    'subscription',
    request,
    args.context
  );
  const initialState: OperationResultState<Result, Variables> = {
    ...initialResult,
    operation,
    fetching: true,
  };
  const result$ = writable(initialState, () => {
    return subscription.unsubscribe;
  });
  const isPaused$ = writable(!!args.pause);

  const subscription = pipe(
    fromStore(isPaused$),
    switchMap(
      (isPaused): Source<Partial<OperationResultState<Data, Variables>>> => {
        if (isPaused) {
          return never as any;
        }

        return concat<Partial<OperationResultState<Data, Variables>>>([
          fromValue({ fetching: true, stale: false }),
          pipe(
            args.client.executeRequestOperation(operation),
            map(({ stale, data, error, extensions, operation }) => ({
              fetching: true,
              stale: !!stale,
              data,
              error,
              operation,
              extensions,
            }))
          ),
          fromValue({ fetching: false }),
        ]);
      }
    ),
    scan((result: OperationResultState<Result, Variables>, partial) => {
      const data =
        partial.data !== undefined
          ? typeof handler === 'function'
            ? handler(result.data, partial.data)
            : partial.data
          : result.data;
      return {
        ...result,
        ...partial,
        data,
      } as OperationResultState<Result, Variables>;
    }, initialState),
    subscribe(result => {
      result$.set(result);
    })
  );

  return {
    ...derived(result$, (result, set) => {
      set(result);
    }),
    ...createPausable(isPaused$),
  };
}

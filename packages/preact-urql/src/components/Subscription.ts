import type { VNode } from 'preact';
import type { AnyVariables } from '@urql/core';

import type {
  UseSubscriptionArgs,
  UseSubscriptionState,
  UseSubscriptionExecute,
  SubscriptionHandler,
} from '../hooks';
import { useSubscription } from '../hooks';

/** Props accepted by {@link Subscription}.
 *
 * @remarks
 * `SubscriptionProps` are the props accepted by the {@link Subscription} component,
 * which is identical to {@link UseSubscriptionArgs} with an added
 * {@link SubscriptionProps.handler} prop, which {@link useSubscription} usually
 * accepts as an additional argument.
 *
 * The result, the {@link SubscriptionState} object, will be passed to
 * a {@link SubscriptionProps.children} function, passed as children
 * to the `Subscription` component.
 */
export type SubscriptionProps<
  Data = any,
  Result = Data,
  Variables extends AnyVariables = AnyVariables,
> = UseSubscriptionArgs<Variables, Data> & {
  /** Accepts the {@link SubscriptionHandler} as a prop. */
  handler?: SubscriptionHandler<Data, Result>;
  children(arg: SubscriptionState<Result, Variables>): VNode<any>;
};

/** Object that {@link SubscriptionProps.children} is called with.
 *
 * @remarks
 * This is an extented {@link UseSubscriptionState} with an added
 * {@link SubscriptionState.executeSubscription} method, which is usually
 * part of a tuple returned by {@link useSubscription}.
 */
export interface SubscriptionState<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
> extends UseSubscriptionState<Data, Variables> {
  /** Alias to {@link useSubscription}’s `executeMutation` function. */
  executeSubscription: UseSubscriptionExecute;
}

/** Component Wrapper around {@link useSubscription} to run a GraphQL subscription.
 *
 * @remarks
 * `Subscription` is a component wrapper around the {@link useSubscription} hook
 * that calls the {@link SubscriptionProps.children} prop, as a function,
 * with the {@link SubscriptionState} object.
 */
export function Subscription<
  Data = any,
  Result = Data,
  Variables extends AnyVariables = AnyVariables,
>(props: SubscriptionProps<Data, Result, Variables>): VNode<any> {
  const subscription = useSubscription<Data, Result, Variables>(
    props,
    props.handler
  );

  return props.children({
    ...subscription[0],
    executeSubscription: subscription[1],
  });
}

import { VNode } from 'preact';
import { OperationContext } from 'urql/core';
import {
  useSubscription,
  UseSubscriptionArgs,
  UseSubscriptionState,
  SubscriptionHandler,
} from '../hooks';

export interface SubscriptionProps<T, R, V> extends UseSubscriptionArgs<V> {
  handler?: SubscriptionHandler<T, R>;
  children: (arg: SubscriptionState<R>) => VNode<any>;
}

export interface SubscriptionState<T> extends UseSubscriptionState<T> {
  executeSubscription: (opts?: Partial<OperationContext>) => void;
}

export function Subscription<T = any, R = T, V = any>(
  props: SubscriptionProps<T, R, V>
): VNode<any> {
  const subscriptionState = useSubscription<T, R, V>(props, props.handler);
  return props.children({
    ...subscriptionState[0],
    executeSubscription: subscriptionState[1],
  });
}

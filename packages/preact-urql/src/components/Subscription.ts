import { VNode } from 'preact';
import { OperationContext } from '@urql/core';

import {
  useSubscription,
  UseSubscriptionArgs,
  UseSubscriptionState,
  SubscriptionHandler,
} from '../hooks';

export interface SubscriptionProps<
  Data = any,
  Result = Data,
  Variables = object
> extends UseSubscriptionArgs<Variables, Data> {
  handler?: SubscriptionHandler<Data, Result>;
  children: (arg: SubscriptionState<Result, Variables>) => VNode<any>;
}

export interface SubscriptionState<Data = any, Variables = object>
  extends UseSubscriptionState<Data, Variables> {
  executeSubscription: (opts?: Partial<OperationContext>) => void;
}

export function Subscription<Data = any, Result = Data, Variables = object>(
  props: SubscriptionProps<Data, Result, Variables>
): VNode<any> {
  const subscription = useSubscription<Data, Result, Variables>(
    props,
    props.handler
  );

  return props.children({
    ...subscription[0],
    executeSubscription: subscription[1],
  });
}

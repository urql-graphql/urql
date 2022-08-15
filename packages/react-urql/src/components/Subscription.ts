import { ReactElement } from 'react';
import { AnyVariables, OperationContext } from '@urql/core';

import {
  useSubscription,
  UseSubscriptionArgs,
  UseSubscriptionState,
  SubscriptionHandler,
} from '../hooks';

export type SubscriptionProps<
  Data = any,
  Result = Data,
  Variables extends AnyVariables = AnyVariables
> = UseSubscriptionArgs<Variables, Data> & {
  handler?: SubscriptionHandler<Data, Result>;
  children: (arg: SubscriptionState<Result, Variables>) => ReactElement<any>;
};

export interface SubscriptionState<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> extends UseSubscriptionState<Data, Variables> {
  executeSubscription: (opts?: Partial<OperationContext>) => void;
}

export function Subscription<
  Data = any,
  Result = Data,
  Variables extends AnyVariables = AnyVariables
>(props: SubscriptionProps<Data, Result, Variables>): ReactElement<any> {
  const subscription = useSubscription<Data, Result, Variables>(
    props,
    props.handler
  );

  return props.children({
    ...subscription[0],
    executeSubscription: subscription[1],
  });
}

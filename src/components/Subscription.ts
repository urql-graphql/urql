import { ReactElement } from 'react';
import { OperationContext } from '../types';

import {
  useSubscription,
  UseSubscriptionArgs,
  UseSubscriptionState,
  SubscriptionHandler,
} from '../hooks';

export interface SubscriptionProps<T, R, V> extends UseSubscriptionArgs<V> {
  handler?: SubscriptionHandler<T, R>;
  children: (arg: SubscriptionState<R>) => ReactElement<any>;
}

export interface SubscriptionState<T> extends UseSubscriptionState<T> {
  executeSubscription: (opts?: Partial<OperationContext>) => void;
}

export function Subscription<T = any, R = T, V = any>(
  props: SubscriptionProps<T, R, V>
): ReactElement<any> {
  const [state, executeSubscription] = useSubscription<T, R, V>(
    props,
    props.handler
  );
  return props.children({ ...state, executeSubscription });
}

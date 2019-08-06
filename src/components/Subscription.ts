import { ReactElement } from 'react';

import {
  useSubscription,
  UseSubscriptionArgs,
  UseSubscriptionState,
  SubscriptionHandler,
} from '../hooks';

export interface SubscriptionProps<T, R, V> extends UseSubscriptionArgs<V> {
  handler?: SubscriptionHandler<T, R>;
  children: (arg: UseSubscriptionState<R>) => ReactElement<any>;
}

export function Subscription<T = any, R = T, V = any>(
  props: SubscriptionProps<T, R, V>
): ReactElement<any> {
  const [state] = useSubscription<T, R, V>(props, props.handler);
  return props.children(state);
}

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

export function Subscription<T = any, R = T, V = any>({
  children,
  handler,
  ...args
}: SubscriptionProps<T, R, V>): ReactElement<any> {
  const [state] = useSubscription<T, R, V>(args, handler);
  return children(state);
}

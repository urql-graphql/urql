import { ReactNode } from 'react';

import {
  useSubscription,
  UseSubscriptionArgs,
  UseSubscriptionState,
  SubscriptionHandler,
} from '../hooks';

export interface SubscriptionProps<T, V, R = T> extends UseSubscriptionArgs<V> {
  handler?: SubscriptionHandler<T, R>;
  children: (arg: UseSubscriptionState<R>) => ReactNode;
}

export function Subscription<T = any, R = T, V = any>({
  children,
  handler,
  ...args
}: SubscriptionProps<T, V, R>): ReactNode {
  const [state] = useSubscription<T, R, V>(args, handler);
  return children(state);
}

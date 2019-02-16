import { useContext, useEffect, useState } from 'react';
import { pipe, subscribe } from 'wonka';
import { Context } from '../context';
import { CombinedError, createQuery, noop } from '../utils';

interface UseSubscriptionArgs {
  query: string;
  variables?: object;
}

type SubscriptionHandler<T, R> = (prev: R | void, data: T) => R;

interface UseSubscriptionState<T> {
  data?: T;
  error?: CombinedError;
}

type UseSubscriptionResponse<T> = [UseSubscriptionState<T>];

export const useSubscription = <T = any, R = T>(
  args: UseSubscriptionArgs,
  handler?: SubscriptionHandler<T, R>
): UseSubscriptionResponse<R> => {
  let unsubscribe = noop;

  const client = useContext(Context);
  const [state, setState] = useState<UseSubscriptionState<R>>({
    error: undefined,
    data: undefined,
  });

  const executeSubscription = () => {
    unsubscribe();

    const [teardown] = pipe(
      client.executeSubscription(createQuery(args.query, args.variables)),
      subscribe(({ data, error }) => {
        setState(s => ({
          data: handler !== undefined ? handler(s.data, data) : data,
          error,
        }));
      })
    );

    unsubscribe = teardown;
  };

  useEffect(() => {
    executeSubscription();
    return unsubscribe;
  }, [args.query, args.variables]);

  return [state];
};

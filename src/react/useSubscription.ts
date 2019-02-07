import { useContext, useEffect, useState } from 'react';
import { pipe, subscribe } from 'wonka';
import { CombinedError, createQuery } from '../lib';
import { Context } from './context';

interface UseSubscriptionArgs {
  query: string;
  variables: any;
}

type SubscriptionHandler<T, R> = (prev: R | void, data: T) => R;

interface UseSubscriptionState<T> {
  fetching: boolean;
  data?: T;
  error?: CombinedError;
}

type UseSubscriptionResponse<T> = [UseSubscriptionState<T>, () => void];

export const useSubscription = <T = any, R = T>(
  args: UseSubscriptionArgs,
  handler?: SubscriptionHandler<T, R>
): UseSubscriptionResponse<T> => {
  let unsubscribe: () => void | undefined;
  const client = useContext(Context);
  const [state, setState] = useState<UseSubscriptionState<R>>({
    fetching: false,
    error: undefined,
    data: undefined,
  });

  const executeUnsubscribe = () => {
    if (unsubscribe !== undefined) {
      unsubscribe();
    }
  };

  const executeSubscription = () => {
    executeUnsubscribe();
    setState({ ...state, fetching: true });

    unsubscribe = pipe(
      client.executeQuery(createQuery(args.query, args.variables)),
      subscribe(({ data, error }) =>
        setState({
          fetching: false,
          data: handler !== undefined ? handler(state.data, data) : data,
          error,
        })
      )
    )[0];
  };

  useEffect(() => {
    executeSubscription();
    return () => executeUnsubscribe();
  }, [args.query, args.variables]);

  // executeQuery === refetch
  return [state, executeSubscription];
};

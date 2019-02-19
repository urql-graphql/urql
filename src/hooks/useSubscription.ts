import { DocumentNode } from 'graphql';
import { useCallback, useContext, useEffect, useState } from 'react';
import { pipe, subscribe } from 'wonka';
import { Context } from '../context';
import { CombinedError, createRequest, noop } from '../utils';

interface UseSubscriptionArgs {
  query: DocumentNode | string;
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
  const request = createRequest(args.query, args.variables);

  const [state, setState] = useState<UseSubscriptionState<R>>({
    error: undefined,
    data: undefined,
  });

  const executeSubscription = useCallback(() => {
    unsubscribe();

    const [teardown] = pipe(
      client.executeSubscription(request),
      subscribe(({ data, error }) => {
        setState(s => ({
          data: handler !== undefined ? handler(s.data, data) : data,
          error,
        }));
      })
    );

    unsubscribe = teardown;
  }, [request.key]);

  useEffect(() => {
    executeSubscription();
    return unsubscribe;
  }, [request.key]);

  return [state];
};

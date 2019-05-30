import { DocumentNode } from 'graphql';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { pipe, subscribe } from 'wonka';
import { Context } from '../context';
import { CombinedError, createRequest, noop } from '../utils';

interface UseSubscriptionArgs<V> {
  query: DocumentNode | string;
  variables?: V;
}

type SubscriptionHandler<T, R> = (prev: R | void, data: T) => R;

interface UseSubscriptionState<T> {
  data?: T;
  error?: CombinedError;
}

type UseSubscriptionResponse<T> = [UseSubscriptionState<T>];

export const useSubscription = <T = any, R = T, V = object>(
  args: UseSubscriptionArgs<V>,
  handler?: SubscriptionHandler<T, R>
): UseSubscriptionResponse<R> => {
  const isMounted = useRef(true);
  const unsubscribe = useRef(noop);

  const client = useContext(Context);
  const request = createRequest(args.query, args.variables as any);

  const [state, setState] = useState<UseSubscriptionState<R>>({
    error: undefined,
    data: undefined,
  });

  const executeSubscription = useCallback(() => {
    unsubscribe.current();

    const [teardown] = pipe(
      client.executeSubscription(request),
      subscribe(
        ({ data, error }) =>
          isMounted.current &&
          setState(s => ({
            data: handler !== undefined ? handler(s.data, data) : data,
            error,
          }))
      )
    );

    unsubscribe.current = teardown;
  }, [request.key]);

  useEffect(() => {
    executeSubscription();
    return () => {
      unsubscribe.current();
      isMounted.current = false;
    };
  }, [request.key]);

  return [state];
};

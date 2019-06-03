import { DocumentNode } from 'graphql';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { pipe, subscribe } from 'wonka';
import { Context } from '../context';
import { CombinedError, noop } from '../utils';
import { useRequest } from './useRequest';

export interface UseSubscriptionArgs<V> {
  query: DocumentNode | string;
  variables?: V;
}

type SubscriptionHandler<T, R> = (prev: R | void, data: T) => R;

interface UseSubscriptionState<T> {
  data?: T;
  error?: CombinedError;
}

export type UseSubscriptionResponse<T> = [UseSubscriptionState<T>];

export const useSubscription = <T = any, R = T, V = object>(
  args: UseSubscriptionArgs<V>,
  handler?: SubscriptionHandler<T, R>
): UseSubscriptionResponse<R> => {
  const isMounted = useRef(true);
  const unsubscribe = useRef(noop);
  const client = useContext(Context);

  // This creates a request which will keep a stable reference
  // if request.key doesn't change
  const request = useRequest(args.query, args.variables);

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
  }, [client, handler, request]);

  // Trigger subscription on query change
  useEffect(() => {
    isMounted.current = true;
    executeSubscription();

    return () => {
      isMounted.current = false;
      unsubscribe.current();
    };
  }, [executeSubscription]);

  return [state];
};

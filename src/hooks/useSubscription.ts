import { DocumentNode } from 'graphql';
import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import { pipe, subscribe } from 'wonka';
import { Context } from '../context';
import { CombinedError, createRequest, noop } from '../utils';

export interface UseSubscriptionArgs<V> {
  query: DocumentNode | string;
  variables?: V;
}

export type SubscriptionHandler<T, R> = (prev: R | void, data: T) => R;

export interface UseSubscriptionState<T> {
  fetching: boolean;
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
  const request = useMemo(
    () => createRequest(args.query, args.variables as any),
    [args.query, args.variables]
  );

  const [state, setState] = useState<UseSubscriptionState<R>>({
    fetching: true,
    error: undefined,
    data: undefined,
  });

  /** Unmount handler */
  useEffect(
    () => () => {
      isMounted.current = false;
    },
    []
  );

  const executeSubscription = useCallback(() => {
    unsubscribe.current();

    const [teardown] = pipe(
      client.executeSubscription(request),
      subscribe(
        ({ data, error }) => {
          if (isMounted.current) {
            setState(s => ({
              fetching: true,
              data: handler !== undefined ? handler(s.data, data) : data,
              error,
            }));
          }
        }
      )
    );

    unsubscribe.current = teardown;
  }, [client, handler, request]);

  /** Trigger subscription on query change. */
  useEffect(() => {
    executeSubscription();

    return unsubscribe.current;
  }, [executeSubscription]);

  return [state];
};

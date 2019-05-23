import { DocumentNode } from 'graphql';
import {
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
  useMemo,
} from 'react';
import { pipe, subscribe } from 'wonka';
import { Context } from '../context';
import { CombinedError, createRequest, noop } from '../utils';

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
  const unsubscribe = useRef(noop);

  const client = useContext(Context);
  const request = useMemo(
    () => createRequest(args.query, args.variables as any),
    [args.query, args.variables]
  );

  const [state, setState] = useState<UseSubscriptionState<R>>({
    error: undefined,
    data: undefined,
  });

  const executeSubscription = useCallback(() => {
    unsubscribe.current();

    const [teardown] = pipe(
      client.executeSubscription(request),
      subscribe(({ data, error }) => {
        setState(s => ({
          data: handler !== undefined ? handler(s.data, data) : data,
          error,
        }));
      })
    );

    unsubscribe.current = teardown;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request.key, handler, client]);

  useEffect(() => {
    executeSubscription();
    return unsubscribe.current;
  }, [executeSubscription]);

  return [state];
};

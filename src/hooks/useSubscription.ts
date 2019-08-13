import { DocumentNode } from 'graphql';
import { useCallback, useContext, useEffect, useRef } from 'react';
import { pipe, subscribe } from 'wonka';
import { Context } from '../context';
import { CombinedError, noop } from '../utils';
import { useRequest } from './useRequest';
import { useImmediateState } from './useImmediateState';
import { OperationContext } from '../types';

export interface UseSubscriptionArgs<V> {
  query: DocumentNode | string;
  variables?: V;
  context?: Partial<OperationContext>;
}

export type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;

export interface UseSubscriptionState<T> {
  fetching: boolean;
  data?: T;
  error?: CombinedError;
  extensions?: Record<string, any>;
}

export type UseSubscriptionResponse<T> = [UseSubscriptionState<T>];

export const useSubscription = <T = any, R = T, V = object>(
  args: UseSubscriptionArgs<V>,
  handler?: SubscriptionHandler<T, R>
): UseSubscriptionResponse<R> => {
  const unsubscribe = useRef(noop);
  const client = useContext(Context);

  const [state, setState] = useImmediateState<UseSubscriptionState<R>>({
    fetching: true,
    error: undefined,
    data: undefined,
    extensions: undefined,
  });

  // This creates a request which will keep a stable reference
  // if request.key doesn't change
  const request = useRequest(args.query, args.variables);

  const executeSubscription = useCallback(() => {
    unsubscribe.current();

    [unsubscribe.current] = pipe(
      client.executeSubscription(request, {
        ...args.context,
      }),
      subscribe(({ data, error, extensions }) => {
        setState(s => ({
          fetching: true,
          data: handler !== undefined ? handler(s.data, data) : data,
          error,
          extensions,
        }));
      })
    );
  }, [client, handler, request, setState, args.context]);

  // Trigger subscription on query change
  // We don't use useImmediateEffect here as we have no way of
  // unsubscribing from subscriptions during SSR
  useEffect(() => {
    executeSubscription();
    return () => unsubscribe.current(); // eslint-disable-line
  }, [executeSubscription]);

  return [state];
};

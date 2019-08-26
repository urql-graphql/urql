import { DocumentNode } from 'graphql';
import { useCallback, useContext, useEffect, useRef } from 'react';
import { pipe, onEnd, subscribe } from 'wonka';
import { Context } from '../context';
import { CombinedError, noop } from '../utils';
import { useRequest } from './useRequest';
import { useImmediateState } from './useImmediateState';
import { OperationContext } from '../types';

export interface UseSubscriptionArgs<V> {
  query: DocumentNode | string;
  variables?: V;
  pause?: boolean;
  context?: Partial<OperationContext>;
}

export type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;

export interface UseSubscriptionState<T> {
  fetching: boolean;
  data?: T;
  error?: CombinedError;
  extensions?: Record<string, any>;
}

export type UseSubscriptionResponse<T> = [
  UseSubscriptionState<T>,
  (opts?: Partial<OperationContext>) => void
];

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

  const executeSubscription = useCallback(
    (opts?: Partial<OperationContext>) => {
      unsubscribe.current();

      [unsubscribe.current] = pipe(
        client.executeSubscription(request, {
          ...args.context,
          ...opts,
        }),
        onEnd(() => setState(s => ({ ...s, fetching: false }))),
        subscribe(({ data, error, extensions }) => {
          setState(s => ({
            fetching: true,
            data: handler !== undefined ? handler(s.data, data) : data,
            error,
            extensions,
          }));
        })
      );
    },
    [client, handler, request, setState, args.context]
  );

  useEffect(() => {
    if (args.pause) {
      unsubscribe.current();
      setState(s => ({ ...s, fetching: false }));
      return noop;
    }

    executeSubscription();
    return () => unsubscribe.current(); // eslint-disable-line
  }, [executeSubscription, args.pause, setState]);

  return [state, executeSubscription];
};

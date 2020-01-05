import { DocumentNode } from 'graphql';
import { useCallback, useRef } from 'preact/hooks';
import { pipe, onEnd, subscribe } from 'wonka';
import { CombinedError, OperationContext } from 'urql/core';
import { useClient } from '../context';
import { useRequest } from './useRequest';
import { noop } from './useQuery';
import { useImmediateEffect } from './useImmediateEffect';
import { useImmediateState } from './useImmediateState';

export interface UseSubscriptionArgs<V> {
  query: DocumentNode | string;
  variables?: V;
  pause?: boolean;
  context?: Partial<OperationContext>;
}

export type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;

export interface UseSubscriptionState<T> {
  fetching: boolean;
  stale: boolean;
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
  const handlerRef = useRef(handler);
  const client = useClient();

  const [state, setState] = useImmediateState<UseSubscriptionState<R>>({
    fetching: false,
    error: undefined,
    data: undefined,
    extensions: undefined,
    stale: false,
  });

  // Update handler on constant ref, since handler changes shouldn't
  // trigger a new subscription run
  handlerRef.current = handler;

  // This creates a request which will keep a stable reference
  // if request.key doesn't change
  const request = useRequest(args.query, args.variables);

  const executeSubscription = useCallback(
    (opts?: Partial<OperationContext>) => {
      unsubscribe.current();

      setState(s => ({ ...s, fetching: true }));

      [unsubscribe.current] = pipe(
        client.executeSubscription(request, {
          ...args.context,
          ...opts,
        }),
        onEnd(() => setState(s => ({ ...s, fetching: false }))),
        subscribe(({ data, error, extensions, stale }) => {
          const { current: handler } = handlerRef;

          setState(s => ({
            fetching: true,
            data: typeof handler === 'function' ? handler(s.data, data) : data,
            error,
            extensions,
            stale: !!stale,
          }));
        })
      );
    },
    [client, request, setState, args.context]
  );

  useImmediateEffect(() => {
    if (args.pause) {
      unsubscribe.current();
      setState(s => ({ ...s, fetching: false }));
      return noop;
    }

    executeSubscription();
    return unsubscribe.current; // eslint-disable-line
  }, [executeSubscription, args.pause, setState]);

  return [state, executeSubscription];
};

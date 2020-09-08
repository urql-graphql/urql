import { DocumentNode } from 'graphql';
import { useCallback, useRef } from 'preact/hooks';
import { pipe, onEnd, subscribe } from 'wonka';
import { CombinedError, OperationContext, Operation } from '@urql/core';
import { useClient } from '../context';
import { useRequest } from './useRequest';
import { noop, initialState } from './useQuery';
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
  operation?: Operation;
}

export type UseSubscriptionResponse<T> = [
  UseSubscriptionState<T>,
  (opts?: Partial<OperationContext>) => void
];

export const useSubscription = <T = any, R = T, V = object>(
  args: UseSubscriptionArgs<V>,
  handler?: SubscriptionHandler<T, R>
): UseSubscriptionResponse<R> => {
  const unsubscribe = useRef<(_1?: any) => void>(noop);
  const handlerRef = useRef(handler);
  const client = useClient();

  const [state, setState] = useImmediateState<UseSubscriptionState<R>>({
    ...initialState,
  });

  // Update handler on constant ref, since handler changes shouldn't
  // trigger a new subscription run
  handlerRef.current = handler!;

  // This creates a request which will keep a stable reference
  // if request.key doesn't change
  const request = useRequest(args.query, args.variables);

  const executeSubscription = useCallback(
    (opts?: Partial<OperationContext>) => {
      unsubscribe.current();

      setState(s => ({ ...s, fetching: true }));

      const result = pipe(
        client.executeSubscription(request, {
          ...args.context,
          ...opts,
        }),
        onEnd(() => setState(s => ({ ...s, fetching: false }))),
        subscribe(result => {
          setState(s => ({
            fetching: true,
            data:
              typeof handlerRef.current === 'function'
                ? handlerRef.current(s.data, result.data)
                : result.data,
            error: result.error,
            extensions: result.extensions,
            stale: !!result.stale,
            operation: result.operation,
          }));
        })
      );
      unsubscribe.current = result.unsubscribe;
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

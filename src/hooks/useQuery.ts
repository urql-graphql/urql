import { DocumentNode } from 'graphql';
import { useCallback, useContext, useRef, useState } from 'react';
import { pipe, subscribe } from 'wonka';
import { Context } from '../context';
import { OperationContext, RequestPolicy } from '../types';
import { CombinedError, noop } from '../utils';
import { useRequest } from './useRequest';
import { useImmediateEffect } from './useImmediateEffect';

export interface UseQueryArgs<V> {
  query: string | DocumentNode;
  variables?: V;
  requestPolicy?: RequestPolicy;
  pause?: boolean;
}

export interface UseQueryState<T> {
  fetching: boolean;
  data?: T;
  error?: CombinedError;
}

export type UseQueryResponse<T> = [
  UseQueryState<T>,
  (opts?: Partial<OperationContext>) => void
];

export const useQuery = <T = any, V = object>(
  args: UseQueryArgs<V>
): UseQueryResponse<T> => {
  const isMounted = useRef(true);
  const unsubscribe = useRef(noop);
  const client = useContext(Context);

  // This creates a request which will keep a stable reference
  // if request.key doesn't change
  const request = useRequest(args.query, args.variables);

  const [state, setState] = useState<UseQueryState<T>>({
    fetching: false,
    error: undefined,
    data: undefined,
  });

  const executeQuery = useCallback(
    (opts?: Partial<OperationContext>) => {
      unsubscribe.current();

      if (args.pause) {
        setState(s => ({ ...s, fetching: false }));
        unsubscribe.current = noop;
        return;
      }

      setState(s => ({ ...s, fetching: true }));

      const [teardown] = pipe(
        client.executeQuery(request, {
          requestPolicy: args.requestPolicy,
          ...opts,
        }),
        subscribe(
          ({ data, error }) => {
            if (isMounted.current) {
              setState({ fetching: false, data, error });
            }
          }
        )
      );

      unsubscribe.current = teardown;
    },
    [request, client, args.pause, args.requestPolicy]
  );

  // Calls executeQuery on initial render immediately, then
  // treats it as a normal effect
  useImmediateEffect(() => {
    isMounted.current = true;
    executeQuery();

    return () => {
      isMounted.current = false;
      unsubscribe.current();
    };
  }, [executeQuery]);

  return [state, executeQuery];
};

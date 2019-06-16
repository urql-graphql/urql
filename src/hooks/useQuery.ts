import { DocumentNode } from 'graphql';
import { useCallback, useContext, useRef } from 'react';
import { pipe, subscribe } from 'wonka';
import { Context } from '../context';
import { OperationContext, RequestPolicy } from '../types';
import { CombinedError, noop, getHookParent } from '../utils';
import { useRequest } from './useRequest';
import { useImmediateEffect } from './useImmediateEffect';
import { useImmediateState } from './useImmediateState';

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
  const devtoolsContext = useRef({ source: getHookParent() });
  const unsubscribe = useRef(noop);
  const client = useContext(Context);

  // This is like useState but updates the state object
  // immediately, when we're still before the initial mount
  const [state, setState] = useImmediateState<UseQueryState<T>>({
    fetching: false,
    data: undefined,
    error: undefined,
  });

  // This creates a request which will keep a stable reference
  // if request.key doesn't change
  const request = useRequest(args.query, args.variables);

  const executeQuery = useCallback(
    (opts?: Partial<OperationContext>) => {
      unsubscribe.current();

      setState(s => ({ ...s, fetching: true }));

      [unsubscribe.current] = pipe(
        client.executeQuery(request, {
          requestPolicy: args.requestPolicy,
          ...opts,
          devtools: devtoolsContext.current,
        }),
        subscribe(({ data, error }) => {
          setState({ fetching: false, data, error });
        })
      );
    },
    [args.requestPolicy, client, request, setState]
  );

  useImmediateEffect(() => {
    if (args.pause) {
      unsubscribe.current();
      return setState(s => ({ ...s, fetching: false }));
    }

    executeQuery();
    return () => unsubscribe.current();
  }, [executeQuery, args.pause, setState]);

  return [state, executeQuery];
};

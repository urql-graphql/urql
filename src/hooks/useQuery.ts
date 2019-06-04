import { DocumentNode } from 'graphql';
import { useCallback, useContext, useRef } from 'react';
import { pipe, subscribe } from 'wonka';
import { Context } from '../context';
import { OperationContext, RequestPolicy } from '../types';
import { CombinedError, noop } from '../utils';
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

      // If useQuery is currently paused, set fetching to
      // false and abort; otherwise start the query
      if (args.pause) {
        setState(s => ({ ...s, fetching: false }));
        unsubscribe.current = noop;
        return;
      } else {
        setState(s => ({ ...s, fetching: true }));
      }

      [unsubscribe.current] = pipe(
        client.executeQuery(request, {
          requestPolicy: args.requestPolicy,
          ...opts,
        }),
        subscribe(({ data, error }) => {
          setState({ fetching: false, data, error });
        })
      );
    },
    [args.pause, args.requestPolicy, client, request, setState]
  );

  // This calls executeQuery immediately during the initial mount and
  // otherwise behaves like a normal useEffect; We call executeQuery
  // everytime it, i.e. its input like request, changes
  useImmediateEffect(() => {
    executeQuery();
    return () => unsubscribe.current();
  }, [executeQuery]);

  return [state, executeQuery];
};

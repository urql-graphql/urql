import { DocumentNode } from 'graphql';
import { useCallback, useContext, useRef } from 'react';
import { pipe, subscribe } from 'wonka';
import { Context } from '../context';
import { OperationContext, RequestPolicy } from '../types';
import { CombinedError, noop } from '../utils';
import { useDevtoolsContext } from './useDevtoolsContext';
import { useRequest } from './useRequest';
import { useImmediateEffect } from './useImmediateEffect';
import { useImmediateState } from './useImmediateState';

export interface UseQueryArgs<V> {
  query: string | DocumentNode;
  variables?: V;
  requestPolicy?: RequestPolicy;
  context?: Partial<OperationContext>;
  pause?: boolean;
  pollInterval?: number;
}

export interface UseQueryState<T> {
  fetching: boolean;
  data?: T;
  error?: CombinedError;
  extensions?: Record<string, any>;
}

export type UseQueryResponse<T> = [
  UseQueryState<T>,
  (opts?: Partial<OperationContext>) => void
];

export const useQuery = <T = any, V = object>(
  args: UseQueryArgs<V>
): UseQueryResponse<T> => {
  const devtoolsContext = useDevtoolsContext();
  const unsubscribe = useRef(noop);
  const client = useContext(Context);

  // This is like useState but updates the state object
  // immediately, when we're still before the initial mount
  const [state, setState] = useImmediateState<UseQueryState<T>>({
    fetching: false,
    data: undefined,
    error: undefined,
    extensions: undefined,
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
          ...args.context,
          ...opts,
          ...devtoolsContext,
        }),
        subscribe(({ data, error, extensions }) => {
          setState({ fetching: false, data, error, extensions });
        })
      );
    },
    [
      args.context,
      args.requestPolicy,
      client,
      devtoolsContext,
      request,
      setState,
    ]
  );

  useImmediateEffect(() => {
    if (args.pause) {
      unsubscribe.current();
      setState(s => ({ ...s, fetching: false }));
      return noop;
    }

    executeQuery();

    let interval: NodeJS.Timeout | null = null;
    if (args.pollInterval) {
      interval = setInterval(() => {
        executeQuery();
      }, args.pollInterval);
    }

    return () => {
      unsubscribe.current(); // eslint-disable-line
      if (interval) clearInterval(interval);
    };
  }, [executeQuery, args.pause, setState, args.pollInterval]);

  return [state, executeQuery];
};

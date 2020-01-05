import { DocumentNode } from 'graphql';
import { pipe, subscribe, onEnd } from 'wonka';
import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { OperationContext, RequestPolicy, CombinedError } from 'urql/core';

import { useClient } from '../context';
import { useRequest } from './useRequest';

const initialState: UseQueryState<any> = {
  fetching: false,
  stale: false,
  data: undefined,
  error: undefined,
  extensions: undefined,
};

export interface UseQueryArgs<V> {
  query: string | DocumentNode;
  variables?: V;
  requestPolicy?: RequestPolicy;
  pollInterval?: number;
  context?: Partial<OperationContext>;
  pause?: boolean;
}

export interface UseQueryState<T> {
  fetching: boolean;
  stale: boolean;
  data?: T;
  error?: CombinedError;
  extensions?: Record<string, any>;
}

export type UseQueryResponse<T> = [
  UseQueryState<T>,
  (opts?: Partial<OperationContext>) => void
];

// eslint-disable-next-line
export const noop = () => {};

export const useQuery = <T = any, V = object>(
  args: UseQueryArgs<V>
): UseQueryResponse<T> => {
  const unsubscribe = useRef(noop);
  const client = useClient();
  const [state, setState] = useState<UseQueryState<T>>(initialState);

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
          pollInterval: args.pollInterval,
          ...args.context,
          ...opts,
        }),
        onEnd(() => setState(s => ({ ...s, fetching: false }))),
        subscribe(({ data, error, extensions, stale }) => {
          setState({
            fetching: false,
            data,
            error,
            extensions,
            stale: !!stale,
          });
        })
      );
    },
    [
      args.context,
      args.requestPolicy,
      args.pollInterval,
      client,
      request,
      setState,
    ]
  );

  useEffect(() => {
    if (args.pause) {
      unsubscribe.current();
      setState(s => ({ ...s, fetching: false }));
      return noop;
    }

    executeQuery();
    return () => unsubscribe.current(); // eslint-disable-line
  }, [executeQuery, args.pause, setState]);

  return [state, executeQuery];
};

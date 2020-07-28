import { DocumentNode } from 'graphql';
import { pipe, subscribe, onEnd } from 'wonka';
import { useRef, useCallback } from 'preact/hooks';
import {
  OperationContext,
  RequestPolicy,
  CombinedError,
  Operation,
} from '@urql/core';

import { useClient } from '../context';
import { useRequest } from './useRequest';
import { useImmediateState } from './useImmediateState';
import { useImmediateEffect } from './useImmediateEffect';

export const initialState: UseQueryState<any> = {
  fetching: false,
  stale: false,
  data: undefined,
  error: undefined,
  operation: undefined,
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
  operation?: Operation;
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
  const unsubscribe = useRef<(_1?: any) => void>(noop);
  const client = useClient();
  const [state, setState] = useImmediateState<UseQueryState<T>>({
    ...initialState,
  });

  // This creates a request which will keep a stable reference
  // if request.key doesn't change
  const request = useRequest(args.query, args.variables);

  const executeQuery = useCallback(
    (opts?: Partial<OperationContext>) => {
      unsubscribe.current();

      setState(s => ({ ...s, fetching: true }));

      const result = pipe(
        client.executeQuery(request, {
          requestPolicy: args.requestPolicy,
          pollInterval: args.pollInterval,
          ...args.context,
          ...opts,
        }),
        onEnd(() => setState(s => ({ ...s, fetching: false }))),
        subscribe(result => {
          setState({
            fetching: false,
            data: result.data,
            error: result.error,
            extensions: result.extensions,
            stale: !!result.stale,
            operation: result.operation,
          });
        })
      );
      unsubscribe.current = result.unsubscribe;
    },
    [
      setState,
      client,
      request,
      args.requestPolicy,
      args.pollInterval,
      args.context,
    ]
  );

  useImmediateEffect(() => {
    if (args.pause) {
      unsubscribe.current();
      setState(s => ({ ...s, fetching: false }));
      return noop;
    }

    executeQuery();
    return unsubscribe.current; // eslint-disable-line
  }, [executeQuery, args.pause, setState]);

  return [state, executeQuery];
};

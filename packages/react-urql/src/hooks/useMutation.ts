import { DocumentNode } from 'graphql';
import { useState, useCallback, useRef, useEffect } from 'react';
import { pipe, toPromise } from 'wonka';

import {
  OperationResult,
  OperationContext,
  CombinedError,
  createRequest,
  Operation,
} from '@urql/core';

import { useClient } from '../context';
import { initialState } from './constants';

export interface UseMutationState<T> {
  fetching: boolean;
  stale: boolean;
  data?: T;
  error?: CombinedError;
  extensions?: Record<string, any>;
  operation?: Operation;
}

export type UseMutationResponse<T, V> = [
  UseMutationState<T>,
  (
    variables?: V,
    context?: Partial<OperationContext>
  ) => Promise<OperationResult<T>>
];

export function useMutation<T = any, V = object>(
  query: DocumentNode | string
): UseMutationResponse<T, V> {
  const isMounted = useRef(true);
  const client = useClient();

  const [state, setState] = useState<UseMutationState<T>>(initialState);

  const executeMutation = useCallback(
    (variables?: V, context?: Partial<OperationContext>) => {
      setState({ ...initialState, fetching: true });

      return pipe(
        client.executeMutation(
          createRequest(query, variables as any),
          context || {}
        ),
        toPromise
      ).then(result => {
        if (isMounted.current) {
          setState({
            fetching: false,
            stale: !!result.stale,
            data: result.data,
            error: result.error,
            extensions: result.extensions,
            operation: result.operation,
          });
        }
        return result;
      });
    },
    [client, query, setState]
  );

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return [state, executeMutation];
}

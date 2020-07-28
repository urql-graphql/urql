import { useCallback } from 'preact/hooks';
import { DocumentNode } from 'graphql';
import { pipe, toPromise } from 'wonka';
import {
  Operation,
  OperationContext,
  CombinedError,
  createRequest,
  OperationResult,
} from '@urql/core';
import { useClient } from '../context';
import { useImmediateState } from './useImmediateState';
import { initialState } from './useQuery';

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

export const useMutation = <T = any, V = object>(
  query: DocumentNode | string
): UseMutationResponse<T, V> => {
  const client = useClient();

  const [state, setState] = useImmediateState<UseMutationState<T>>({
    ...initialState,
  });

  const executeMutation = useCallback(
    (variables?: V, context?: Partial<OperationContext>) => {
      setState({
        ...initialState,
        fetching: true,
      });

      return pipe(
        client.executeMutation(
          createRequest(query, variables as any),
          context || {}
        ),
        toPromise
      ).then(result => {
        setState({
          fetching: false,
          stale: !!result.stale,
          data: result.data,
          error: result.error,
          extensions: result.extensions,
          operation: result.operation,
        });
        return result;
      });
    },
    [client, query, setState]
  );

  return [state, executeMutation];
};

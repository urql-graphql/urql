import { DocumentNode } from 'graphql';
import { useState, useCallback } from 'react';
import { pipe, toPromise } from 'wonka';
import { useClient } from '../context';
import { OperationResult, OperationContext } from '../types';
import { CombinedError, createRequest } from '../utils';
import { initialState } from './constants';

export interface UseMutationState<T> {
  fetching: boolean;
  stale: boolean;
  data?: T;
  error?: CombinedError;
  extensions?: Record<string, any>;
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

  const [state, setState] = useState<UseMutationState<T>>(initialState);

  const executeMutation = useCallback(
    (variables?: V, context?: Partial<OperationContext>) => {
      setState({ ...initialState, fetching: true });

      const request = createRequest(query, variables as any);

      return pipe(
        client.executeMutation(request, context || {}),
        toPromise
      ).then(result => {
        setState({
          fetching: false,
          stale: !!result.stale,
          data: result.data,
          error: result.error,
          extensions: result.extensions,
        });
        return result;
      });
    },
    [client, query, setState]
  );

  return [state, executeMutation];
};

import { useCallback } from 'preact/hooks';
import { DocumentNode } from 'graphql';
import { pipe, toPromise } from 'wonka';
import {
  OperationResult,
  OperationContext,
  CombinedError,
  createRequest,
} from 'urql/core';
import { useClient } from '../context';
import { useImmediateState } from './useImmediateState';

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

  const [state, setState] = useImmediateState<UseMutationState<T>>({
    fetching: false,
    stale: false,
    error: undefined,
    data: undefined,
    extensions: undefined,
  });

  const executeMutation = useCallback(
    (variables?: V, context?: Partial<OperationContext>) => {
      setState({
        fetching: true,
        stale: false,
        error: undefined,
        data: undefined,
        extensions: undefined,
      });

      const request = createRequest(query, variables as any);

      return pipe(
        client.executeMutation(request, context || {}),
        toPromise
      ).then(result => {
        const { stale, data, error, extensions } = result;
        setState({ fetching: false, stale: !!stale, data, error, extensions });
        return result;
      });
    },
    [client, query, setState]
  );

  return [state, executeMutation];
};

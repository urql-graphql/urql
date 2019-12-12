import { DocumentNode } from 'graphql';
import { useState, useCallback } from 'react';
import { pipe, toPromise } from 'wonka';
import { useClient } from '../context';
import { OperationResult, OperationContext } from '../types';
import { CombinedError, createRequest } from '../utils';

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

  const [state, setState] = useState<UseMutationState<T>>({
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

if (process.env.NODE_ENV !== 'production') {
  Object.defineProperty(useMutation, 'name', {
    get() {
      return 'useMutation';
    },
  });
}

import { ref, Ref, inject } from 'vue';
import {
  Client,
  CombinedError,
  createRequest,
  Operation,
  OperationContext,
  OperationResult,
} from '@urql/core';
import { DocumentNode } from 'graphql';
import { initialState } from './constants';
import { pipe, toPromise } from 'wonka';

export interface UseMutationState<T, V> {
  fetching: boolean;
  stale: boolean;
  data?: T;
  error?: CombinedError;
  extensions?: Record<string, any>;
  operation?: Operation;
  executeMutation: (
    variables: V,
    context?: Partial<OperationContext>
  ) => Promise<OperationResult<T>>;
}

export type UseMutationResponse<T, V> = UseMutationState<T, V>;

export function useMutation<T = any, V = object>(
  query: DocumentNode | string
): UseMutationResponse<T, V> {
  const client = inject('$urql') as Client;

  if (process.env.NODE_ENV !== 'production' && !client) {
    throw new Error(
      'Cannot detect urql Client, did you forget to call `useClient`?'
    );
  }

  const result: Ref<UseMutationState<T, V>> = ref({
    ...initialState,
    executeMutation: Promise.resolve,
  });

  result.value.executeMutation = async (
    variables?: V,
    context?: Partial<OperationContext>
  ) => {
    result.value.fetching = true;
    return pipe(
      client.executeMutation(
        createRequest(query, variables as any),
        context || {}
      ),
      toPromise
    ).then(response => {
      result.value.fetching = false;
      result.value.stale = !!response.stale;
      result.value.data = response.data;
      result.value.error = response.error;
      result.value.extensions = response.extensions;
      result.value.operation = response.operation;

      return response;
    });
  };

  return result.value;
}

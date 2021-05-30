/* eslint-disable react-hooks/rules-of-hooks */

import { ref, Ref } from 'vue';
import { DocumentNode } from 'graphql';
import { pipe, toPromise } from 'wonka';

import {
  Client,
  TypedDocumentNode,
  CombinedError,
  Operation,
  OperationContext,
  OperationResult,
  createRequest,
} from '@urql/core';

import { useClient } from './useClient';

export interface UseMutationState<T, V> {
  fetching: Ref<boolean>;
  stale: Ref<boolean>;
  data: Ref<T | undefined>;
  error: Ref<CombinedError | undefined>;
  extensions: Ref<Record<string, any> | undefined>;
  operation: Ref<Operation<T, V> | undefined>;
  executeMutation: (
    variables: V,
    context?: Partial<OperationContext>
  ) => Promise<OperationResult<T>>;
}

export type UseMutationResponse<T, V> = UseMutationState<T, V>;

export function useMutation<T = any, V = any>(
  query: TypedDocumentNode<T, V> | DocumentNode | string
): UseMutationResponse<T, V> {
  return callUseMutation(query);
}

export function callUseMutation<T = any, V = any>(
  query: TypedDocumentNode<T, V> | DocumentNode | string,
  client: Client = useClient()
): UseMutationResponse<T, V> {
  const data: Ref<T | undefined> = ref();
  const stale: Ref<boolean> = ref(false);
  const fetching: Ref<boolean> = ref(false);
  const error: Ref<CombinedError | undefined> = ref();
  const operation: Ref<Operation<T, V> | undefined> = ref();
  const extensions: Ref<Record<string, any> | undefined> = ref();

  return {
    data,
    stale,
    fetching,
    error,
    operation,
    extensions,
    executeMutation(
      variables: V,
      context?: Partial<OperationContext>
    ): Promise<OperationResult<T, V>> {
      fetching.value = true;
      return pipe(
        client.executeMutation<T, V>(
          createRequest<T, V>(query, variables),
          context || {}
        ),
        toPromise
      ).then((res: OperationResult) => {
        data.value = res.data;
        stale.value = !!res.stale;
        fetching.value = false;
        error.value = res.error;
        operation.value = res.operation;
        extensions.value = res.extensions;
        return res;
      });
    },
  };
}

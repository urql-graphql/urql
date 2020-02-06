import { VNode } from 'preact';
import { DocumentNode } from 'graphql';
import { OperationResult, OperationContext } from '@urql/core';
import { useMutation, UseMutationState } from '../hooks';

export interface MutationProps<T, V> {
  query: DocumentNode | string;
  children: (arg: MutationState<T, V>) => VNode<any>;
}

export interface MutationState<T, V> extends UseMutationState<T> {
  executeMutation: (
    variables?: V,
    context?: Partial<OperationContext>
  ) => Promise<OperationResult<T>>;
}

export function Mutation<T = any, V = any>(
  props: MutationProps<T, V>
): VNode<any> {
  const mutationState = useMutation<T, V>(props.query);
  return props.children({
    ...mutationState[0],
    executeMutation: mutationState[1],
  });
}

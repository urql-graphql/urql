import { VNode } from 'preact';
import { DocumentNode } from 'graphql';
import {
  TypedDocumentNode,
  OperationResult,
  OperationContext,
} from '@urql/core';
import { useMutation, UseMutationState } from '../hooks';

export interface MutationProps<Data = any, Variables = object> {
  query: DocumentNode | TypedDocumentNode<Data, Variables> | string;
  children: (arg: MutationState<Data, Variables>) => VNode<any>;
}

export interface MutationState<Data = any, Variables = object>
  extends UseMutationState<Data, Variables> {
  executeMutation: (
    variables?: Variables,
    context?: Partial<OperationContext>
  ) => Promise<OperationResult<Data, Variables>>;
}

export function Mutation<Data = any, Variables = any>(
  props: MutationProps<Data, Variables>
): VNode<any> {
  const mutation = useMutation<Data, Variables>(props.query);
  return props.children({ ...mutation[0], executeMutation: mutation[1] });
}

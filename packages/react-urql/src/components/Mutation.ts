import { DocumentNode } from 'graphql';
import { ReactElement } from 'react';
import {
  AnyVariables,
  TypedDocumentNode,
  OperationResult,
  OperationContext,
} from '@urql/core';
import { useMutation, UseMutationState } from '../hooks';

export interface MutationProps<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> {
  query: DocumentNode | TypedDocumentNode<Data, Variables> | string;
  children: (arg: MutationState<Data, Variables>) => ReactElement<any>;
}

export interface MutationState<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> extends UseMutationState<Data, Variables> {
  executeMutation: (
    variables: Variables,
    context?: Partial<OperationContext>
  ) => Promise<OperationResult<Data, Variables>>;
}

export function Mutation<Data = any, Variables = any>(
  props: MutationProps<Data, Variables>
): ReactElement<any> {
  const mutation = useMutation<Data, Variables>(props.query);
  return props.children({ ...mutation[0], executeMutation: mutation[1] });
}

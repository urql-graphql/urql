import { ReactElement } from 'react';
import { DocumentNode } from 'graphql';
import { OperationResult, OperationContext } from '../types';
import { useMutation, UseMutationState } from '../hooks';

export interface MutationProps<T, V> {
  query: DocumentNode | string;
  children: (arg: MutationState<T, V>) => ReactElement<any>;
}

export interface MutationState<T, V> extends UseMutationState<T> {
  executeMutation: (
    variables?: V,
    context?: Partial<OperationContext>
  ) => Promise<OperationResult<T>>;
}

export function Mutation<T = any, V = any>(
  props: MutationProps<T, V>
): ReactElement<any> {
  const [state, executeMutation] = useMutation<T, V>(props.query);
  return props.children({ ...state, executeMutation });
}

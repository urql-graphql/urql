import type { ReactElement } from 'react';
import type { AnyVariables, DocumentInput } from '@urql/core';

import type { UseMutationState, UseMutationExecute } from '../hooks';
import { useMutation } from '../hooks';

/** Props accepted by {@link Mutation}.
 *
 * @remarks
 * `MutationProps` are the props accepted by the {@link Mutation} component.
 *
 * The result, the {@link MutationState} object, will be passed to
 * a {@link MutationProps.children} function, passed as children
 * to the `Mutation` component.
 */
export interface MutationProps<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
> {
  /* The GraphQL mutation document that {@link useMutation} will execute. */
  query: DocumentInput<Data, Variables>;
  children(arg: MutationState<Data, Variables>): ReactElement<any>;
}

/** Object that {@link MutationProps.children} is called with.
 *
 * @remarks
 * This is an extented {@link UseMutationstate} with an added
 * {@link MutationState.executeMutation} method, which is usually
 * part of a tuple returned by {@link useMutation}.
 */
export interface MutationState<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
> extends UseMutationState<Data, Variables> {
  /** Alias to {@link useMutation}’s `executeMutation` function. */
  executeMutation: UseMutationExecute<Data, Variables>;
}

/** Component Wrapper around {@link useMutation} to run a GraphQL query.
 *
 * @remarks
 * `Mutation` is a component wrapper around the {@link useMutation} hook
 * that calls the {@link MutationProps.children} prop, as a function,
 * with the {@link MutationState} object.
 */
export function Mutation<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
>(props: MutationProps<Data, Variables>): ReactElement<any> {
  const mutation = useMutation<Data, Variables>(props.query);
  return props.children({ ...mutation[0], executeMutation: mutation[1] });
}

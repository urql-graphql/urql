import * as React from 'react';
import { pipe, onPush, filter, toPromise, take } from 'wonka';

import type {
  AnyVariables,
  DocumentInput,
  OperationResult,
  OperationContext,
  CombinedError,
  Operation,
} from '@urql/core';
import { createRequest } from '@urql/core';

import { useClient } from '../context';
import { deferDispatch, initialState } from './state';

/** State of the last mutation executed by your {@link useMutation} hook.
 *
 * @remarks
 * `UseMutationState` is returned (in a tuple) by {@link useMutation} and
 * gives you the {@link OperationResult} of the last mutation executed
 * with {@link UseMutationExecute}.
 *
 * Even if the mutation document passed to {@link useMutation} changes,
 * the state isn’t reset, so you can keep displaying the previous result.
 */
export interface UseMutationState<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
> {
  /** Indicates whether `useMutation` is currently executing a mutation. */
  fetching: boolean;
  /** Indicates that the mutation result is not fresh.
   *
   * @remarks
   * The `stale` flag is set to `true` when a new result for the mutation
   * is expected.
   * This is mostly unused for mutations and will rarely affect you, and
   * is more relevant for queries.
   *
   * @see {@link OperationResult.stale} for the source of this value.
   */
  stale: boolean;
  /** The {@link OperationResult.data} for the executed mutation. */
  data?: Data;
  /** The {@link OperationResult.error} for the executed mutation. */
  error?: CombinedError;
  /** The {@link OperationResult.extensions} for the executed mutation. */
  extensions?: Record<string, any>;
  /** The {@link OperationResult.hasNext} for the executed query. */
  hasNext: boolean;
  /** The {@link Operation} that the current state is for.
   *
   * @remarks
   * This is the mutation {@link Operation} that has last been executed.
   * When {@link UseQueryState.fetching} is `true`, this is the
   * last `Operation` that the current state was for.
   */
  operation?: Operation<Data, Variables>;
}

/** Triggers {@link useMutation} to execute its GraphQL mutation operation.
 *
 * @param variables - variables using which the mutation will be executed.
 * @param context - optionally, context options that will be merged with the hook's
 * {@link UseQueryArgs.context} options and the `Client`’s options.
 * @returns the {@link OperationResult} of the mutation.
 *
 * @remarks
 * When called, {@link useMutation} will start the GraphQL mutation
 * it currently holds and use the `variables` passed to it.
 *
 * Once the mutation response comes back from the API, its
 * returned promise will resolve to the mutation’s {@link OperationResult}
 * and the {@link UseMutationState} will be updated with the result.
 *
 * @example
 * ```ts
 * const [result, executeMutation] = useMutation(UpdateTodo);
 * const start = async ({ id, title }) => {
 *   const result = await executeMutation({ id, title });
 * };
 */
export type UseMutationExecute<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
> = (
  variables: Variables,
  context?: Partial<OperationContext>
) => Promise<OperationResult<Data, Variables>>;

/** Result tuple returned by the {@link useMutation} hook.
 *
 * @remarks
 * Similarly to a `useState` hook’s return value,
 * the first element is the {@link useMutation}’s state, updated
 * as mutations are executed with the second value, which is
 * used to start mutations and is a {@link UseMutationExecute}
 * function.
 */
export type UseMutationResponse<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
> = [UseMutationState<Data, Variables>, UseMutationExecute<Data, Variables>];

/** Hook to create a GraphQL mutation, run by passing variables to the returned execute function.
 *
 * @param query - a GraphQL mutation document which `useMutation` will execute.
 * @returns a {@link UseMutationResponse} tuple of a {@link UseMutationState} result,
 * and an execute function to start the mutation.
 *
 * @remarks
 * `useMutation` allows GraphQL mutations to be defined and keeps its state
 * after the mutation is started with the returned execute function.
 *
 * Given a GraphQL mutation document it returns state to keep track of the
 * mutation state and a {@link UseMutationExecute} function, which accepts
 * variables for the mutation to be executed.
 * Once called, the mutation executes and the state will be updated with
 * the mutation’s result.
 *
 * @see {@link https://urql.dev/goto/urql/docs/basics/react-preact/#mutations} for `useMutation` docs.
 *
 * @example
 * ```ts
 * import { gql, useMutation } from 'urql';
 *
 * const UpdateTodo = gql`
 *   mutation ($id: ID!, $title: String!) {
 *     updateTodo(id: $id, title: $title) {
 *       id, title
 *     }
 *   }
 * `;
 *
 * const UpdateTodo = () => {
 *   const [result, executeMutation] = useMutation(UpdateTodo);
 *   const start = async ({ id, title }) => {
 *     const result = await executeMutation({ id, title });
 *   };
 *   // ...
 * };
 * ```
 */
export function useMutation<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
>(query: DocumentInput<Data, Variables>): UseMutationResponse<Data, Variables> {
  const isMounted = React.useRef(true);
  const client = useClient();

  const [state, setState] =
    React.useState<UseMutationState<Data, Variables>>(initialState);

  const executeMutation = React.useCallback(
    (variables: Variables, context?: Partial<OperationContext>) => {
      deferDispatch(setState, { ...initialState, fetching: true });
      return pipe(
        client.executeMutation<Data, Variables>(
          createRequest<Data, Variables>(query, variables),
          context || {}
        ),
        onPush(result => {
          if (isMounted.current) {
            deferDispatch(setState, {
              fetching: false,
              stale: result.stale,
              data: result.data,
              error: result.error,
              extensions: result.extensions,
              operation: result.operation,
              hasNext: result.hasNext,
            });
          }
        }),
        filter(result => !result.hasNext),
        take(1),
        toPromise
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, query, setState]
  );

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return [state, executeMutation];
}

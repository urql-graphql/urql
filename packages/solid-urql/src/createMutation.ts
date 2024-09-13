import { createStore } from 'solid-js/store';
import {
  type AnyVariables,
  type DocumentInput,
  type OperationContext,
  type Operation,
  type OperationResult,
  type CombinedError,
  createRequest,
} from '@urql/core';
import { useClient } from './context';
import { pipe, onPush, filter, take, toPromise } from 'wonka';

export type CreateMutationState<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
> = {
  /** Indicates whether `createMutation` is currently executing a mutation. */
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
  /** The {@link Operation} that the current state is for.
   *
   * @remarks
   * This is the mutation {@link Operation} that has last been executed.
   * When {@link CreateMutationState.fetching} is `true`, this is the
   * last `Operation` that the current state was for.
   */
  operation?: Operation<Data, Variables>;
};

/** Triggers {@link createMutation} to execute its GraphQL mutation operation.
 *
 * @param variables - variables using which the mutation will be executed.
 * @param context - optionally, context options that will be merged with the hook's
 * context options and the `Client`’s options.
 * @returns the {@link OperationResult} of the mutation.
 *
 * @remarks
 * When called, {@link createMutation} will start the GraphQL mutation
 * it currently holds and use the `variables` passed to it.
 *
 * Once the mutation response comes back from the API, its
 * returned promise will resolve to the mutation’s {@link OperationResult}
 * and the {@link CreateMutationState} will be updated with the result.
 *
 * @example
 * ```ts
 * const [result, executeMutation] = createMutation(UpdateTodo);
 * const start = async ({ id, title }) => {
 *   const result = await executeMutation({ id, title });
 * };
 */
export type CreateMutationExecute<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
> = (
  variables: Variables,
  context?: Partial<OperationContext>
) => Promise<OperationResult<Data, Variables>>;

/** Result tuple returned by the {@link createMutation} hook.
 *
 * @remarks
 * Similarly to a `createSignal` hook’s return value,
 * the first element is the {@link createMutation}’s state, updated
 * as mutations are executed with the second value, which is
 * used to start mutations and is a {@link CreateMutationExecute}
 * function.
 */
export type CreateMutationResult<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
> = [
  CreateMutationState<Data, Variables>,
  CreateMutationExecute<Data, Variables>,
];

/** Hook to create a GraphQL mutation, run by passing variables to the returned execute function.
 *
 * @param query - a GraphQL mutation document which `createMutation` will execute.
 * @returns a {@link CreateMutationResult} tuple of a {@link CreateMutationState} result,
 * and an execute function to start the mutation.
 *
 * @remarks
 * `createMutation` allows GraphQL mutations to be defined and keeps its state
 * after the mutation is started with the returned execute function.
 *
 * Given a GraphQL mutation document it returns state to keep track of the
 * mutation state and a {@link CreateMutationExecute} function, which accepts
 * variables for the mutation to be executed.
 * Once called, the mutation executes and the state will be updated with
 * the mutation’s result.
 *
 * @example
 * ```ts
 * import { gql, createMutation } from '@urql/solid';
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
 *   const [result, executeMutation] = createMutation(UpdateTodo);
 *   const start = async ({ id, title }) => {
 *     const result = await executeMutation({ id, title });
 *   };
 *   // ...
 * };
 * ```
 */
export const createMutation = <
  Data = any,
  Variables extends AnyVariables = AnyVariables,
>(
  query: DocumentInput<Data, Variables>
): CreateMutationResult<Data, Variables> => {
  const client = useClient();
  const initialResult: CreateMutationState<Data, Variables> = {
    operation: undefined,
    fetching: false,
    stale: false,
    data: undefined,
    error: undefined,
    extensions: undefined,
  };

  const [state, setState] =
    createStore<CreateMutationState<Data, Variables>>(initialResult);

  const execute = (
    variables: Variables,
    context?: Partial<OperationContext>
  ) => {
    setState({ ...initialResult, fetching: true });

    const request = createRequest(query, variables);
    return pipe(
      client.executeMutation(request, context),
      onPush(result => {
        setState({
          fetching: false,
          stale: result.stale,
          data: result.data,
          error: result.error,
          extensions: result.extensions,
          operation: result.operation,
        });
      }),
      filter(result => !result.hasNext),
      take(1),
      toPromise
    );
  };

  return [state, execute];
};

import {
  type AnyVariables,
  type DocumentInput,
  type OperationContext,
  type OperationResult,
  createRequest,
} from '@urql/core';
import { batch } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { useClient } from './context';
import { pipe, onPush, filter, take, toPromise } from 'wonka';

export type CreateMutationState<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
> = {
  data?: Data;
  error?: OperationResult<Data, Variables>['error'];
  fetching: boolean;
  extensions?: Record<string, any>;
  stale: boolean;
  hasNext: boolean;
};

export type CreateMutationExecute<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
> = (
  variables: Variables,
  context?: Partial<OperationContext>
) => Promise<OperationResult<Data, Variables>>;

export type CreateMutationResult<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
> = [
  CreateMutationState<Data, Variables>,
  CreateMutationExecute<Data, Variables>,
];

/**
 * Creates a GraphQL mutation for SolidStart.
 *
 * @remarks
 * This is similar to @urql/solid's createMutation but optimized for SolidStart.
 *
 * @example
 * ```tsx
 * import { createMutation } from '@urql/solid-start';
 * import { gql } from '@urql/core';
 *
 * const AddTodoMutation = gql`
 *   mutation AddTodo($title: String!) {
 *     addTodo(title: $title) { id title }
 *   }
 * `;
 *
 * function AddTodoForm() {
 *   const [state, addTodo] = createMutation(AddTodoMutation);
 *
 *   const handleSubmit = async (e: Event) => {
 *     e.preventDefault();
 *     const result = await addTodo({ title: 'New Todo' });
 *     if (result.data) {
 *       console.log('Todo added:', result.data.addTodo);
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <button type="submit" disabled={state.fetching}>
 *         Add Todo
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */
export function createMutation<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
>(
  mutation: DocumentInput<Data, Variables>,
  _key?: string
): CreateMutationResult<Data, Variables> {
  const client = useClient();

  const initialResult: CreateMutationState<Data, Variables> = {
    fetching: false,
    stale: false,
    hasNext: false,
    data: undefined,
    error: undefined,
    extensions: undefined,
  };

  // Create a fine-grained reactive store for mutation state
  const [state, setState] =
    createStore<CreateMutationState<Data, Variables>>(initialResult);

  const executeMutation: CreateMutationExecute<Data, Variables> = (
    variables: Variables,
    context?: Partial<OperationContext>
  ) => {
    setState({ ...initialResult, fetching: true });

    const request = createRequest(mutation, variables);
    return pipe(
      client.executeMutation(request, context),
      onPush(result => {
        batch(() => {
          setState('data', reconcile(result.data));
          setState({
            fetching: false,
            stale: result.stale,
            error: result.error,
            extensions: result.extensions,
            hasNext: result.hasNext,
          });
        });
      }),
      filter(result => !result.hasNext),
      take(1),
      toPromise
    );
  };

  return [state, executeMutation];
}

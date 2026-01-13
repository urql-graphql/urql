import {
  type AnyVariables,
  type DocumentInput,
  type OperationContext,
  type OperationResult,
  createRequest,
} from '@urql/core';
import { action, type Action } from '@solidjs/router';
import { pipe, filter, take, toPromise } from 'wonka';
import { useClient } from './context';

export type CreateMutationAction<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
> = Action<
  [variables: Variables, context?: Partial<OperationContext>],
  OperationResult<Data, Variables>
>;

/**
 * Creates a GraphQL mutation action for SolidStart.
 *
 * @remarks
 * This uses SolidStart's `action()` primitive to create an action that can be
 * used with `useAction()` and `useSubmission()` in components for form handling and
 * progressive enhancement.
 *
 * IMPORTANT: Must be called inside a component where it has access to the URQL context.
 *
 * @param mutation - The GraphQL mutation document
 * @param key - Cache key for SolidStart's router
 *
 * @example
 * ```tsx
 * import { createMutation } from '@urql/solid-start';
 * import { useAction, useSubmission } from '@solidjs/router';
 * import { gql } from '@urql/core';
 *
 * function AddTodoForm() {
 *   const addTodoAction = createMutation(
 *     gql`mutation AddTodo($title: String!) {
 *       addTodo(title: $title) { id title }
 *     }`,
 *     'add-todo'
 *   );
 *
 *   const addTodo = useAction(addTodoAction);
 *   const submission = useSubmission(addTodoAction);
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
 *       <button type="submit" disabled={submission.pending}>
 *         Add Todo
 *       </button>
 *       {submission.result?.error && <p>Error: {submission.result.error.message}</p>}
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
  key: string
): CreateMutationAction<Data, Variables> {
  const client = useClient();
  return action(
    async (variables: Variables, context?: Partial<OperationContext>) => {
      const request = createRequest(mutation, variables);
      return pipe(
        client.executeMutation(request, context),
        filter(result => !result.hasNext),
        take(1),
        toPromise
      );
    },
    key
  );
}

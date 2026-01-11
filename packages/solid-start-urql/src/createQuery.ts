import {
  type AnyVariables,
  type DocumentInput,
  type OperationContext,
  type OperationResult,
  type RequestPolicy,
  createRequest,
} from '@urql/core';
import { createAsync } from '@solidjs/router';
import { type Accessor } from 'solid-js';
import { useClient } from './context';
import { type MaybeAccessor, access } from './utils';

export type CreateQueryArgs<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
> = {
  query: DocumentInput<Data, Variables>;
  variables?: MaybeAccessor<Variables>;
  requestPolicy?: MaybeAccessor<RequestPolicy>;
  context?: MaybeAccessor<Partial<OperationContext>>;
  pause?: MaybeAccessor<boolean>;
  key?: string;
};

export type CreateQueryResult<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
> = Accessor<OperationResult<Data, Variables> | undefined>;

/**
 * Creates a GraphQL query using SolidStart's createAsync primitive.
 *
 * @remarks
 * This integrates with SolidStart for SSR and automatic data fetching.
 * The query will automatically re-execute when variables change.
 *
 * @example
 * ```tsx
 * import { createQuery } from '@urql/solid-start';
 * import { gql } from '@urql/core';
 *
 * const TodosQuery = gql`{ todos { id title } }`;
 *
 * function TodoList() {
 *   const todos = createQuery({ query: TodosQuery });
 *
 *   return (
 *     <Show when={todos()?.data}>
 *       <For each={todos()?.data.todos}>
 *         {todo => <div>{todo.title}</div>}
 *       </For>
 *     </Show>
 *   );
 * }
 * ```
 */
export function createQuery<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
>(args: CreateQueryArgs<Data, Variables>): CreateQueryResult<Data, Variables> {
  const client = useClient();

  const getVariables = () => access(args.variables);
  const getRequestPolicy = () => access(args.requestPolicy);
  const getContext = () => access(args.context);
  const getPause = () => access(args.pause);

  // Use createAsync to execute the query
  const result = createAsync(
    async () => {
      if (getPause()) return undefined;

      const request = createRequest(args.query, getVariables() as Variables);
      const context: Partial<OperationContext> = {
        requestPolicy: getRequestPolicy(),
        ...getContext(),
      };

      return await client.executeQuery(request, context).toPromise();
    },
    { deferStream: true }
  );

  return result;
}

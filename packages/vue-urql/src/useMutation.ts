/* eslint-disable react-hooks/rules-of-hooks */

import { ref, Ref } from 'vue';
import { DocumentNode } from 'graphql';
import { pipe, toPromise, take } from 'wonka';

import {
  Client,
  AnyVariables,
  TypedDocumentNode,
  CombinedError,
  Operation,
  OperationContext,
  OperationResult,
  createRequest,
} from '@urql/core';

import { useClient } from './useClient';
import { unwrapPossibleProxy } from './utils';

/** State of the last mutation executed by {@link useMutation}.
 *
 * @remarks
 * `UseMutationResponse` is returned by {@link useMutation} and
 * gives you the {@link OperationResult} of the last executed mutation,
 * and a {@link UseMutationResponse.executeMutation} method to
 * start mutations.
 *
 * Even if the mutation document passed to {@link useMutation} changes,
 * the state isn’t reset, so you can keep displaying the previous result.
 */
export interface UseMutationResponse<T, V extends AnyVariables = AnyVariables> {
  /** Indicates whether `useMutation` is currently executing a mutation. */
  fetching: Ref<boolean>;
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
  stale: Ref<boolean>;
  /** Reactive {@link OperationResult.data} for the executed mutation. */
  data: Ref<T | undefined>;
  /** Reactive {@link OperationResult.error} for the executed mutation. */
  error: Ref<CombinedError | undefined>;
  /** Reactive {@link OperationResult.extensions} for the executed mutation. */
  extensions: Ref<Record<string, any> | undefined>;
  /** Reactive {@link Operation} that the current state is for.
   *
   * @remarks
   * This is the mutation {@link Operation} that has last been executed.
   * When {@link UseQueryState.fetching} is `true`, this is the
   * last `Operation` that the current state was for.
   */
  operation: Ref<Operation<T, V> | undefined>;
  /** Triggers {@link useMutation} to execute its GraphQL mutation operation.
   *
   * @param variables - variables using which the mutation will be executed.
   * @param context - optionally, context options that will be merged with
   * {@link UseMutationArgs.context} and the `Client`’s options.
   * @returns the {@link OperationResult} of the mutation.
   *
   * @remarks
   * When called, {@link useMutation} will start the GraphQL mutation
   * it currently holds and use the `variables` passed to it.
   *
   * Once the mutation response comes back from the API, its
   * returned promise will resolve to the mutation’s {@link OperationResult}
   * and the {@link UseMutationResponse} will be updated with the result.
   *
   * @example
   * ```ts
   * const result = useMutation(UpdateTodo);
   * const start = async ({ id, title }) => {
   *   const result = await result.executeMutation({ id, title });
   * };
   */
  executeMutation(
    variables: V,
    context?: Partial<OperationContext>
  ): Promise<OperationResult<T>>;
}

/** Function to create a GraphQL mutation, run by passing variables to {@link UseMutationResponse.executeMutation}
 *
 * @param query - a GraphQL mutation document which `useMutation` will execute.
 * @returns a {@link UseMutationResponse} object.
 *
 * @remarks
 * `useMutation` allows GraphQL mutations to be defined inside Vue `setup` functions,
 * and keeps its state after the mutation is started. Mutations can be started by calling
 * {@link UseMutationResponse.executeMutation} with variables.
 *
 * The returned result updates when a mutation is executed and keeps
 * track of the last mutation result.
 *
 * @see {@link https://urql.dev/goto/docs/basics/vue#mutations} for `useMutation` docs.
 *
 * @example
 * ```ts
 * import { gql, useMutation } from '@urql/vue';
 *
 * const UpdateTodo = gql`
 *   mutation ($id: ID!, $title: String!) {
 *     updateTodo(id: $id, title: $title) {
 *       id, title
 *     }
 *   }
 * `;
 *
 * export default {
 *   setup() {
 *     const result = useMutation(UpdateTodo);
 *     const start = async ({ id, title }) => {
 *       const result = await result.executeMutation({ id, title });
 *     };
 *     // ...
 *   },
 * };
 * ```
 */
export function useMutation<T = any, V extends AnyVariables = AnyVariables>(
  query: TypedDocumentNode<T, V> | DocumentNode | string
): UseMutationResponse<T, V> {
  return callUseMutation(query);
}

export function callUseMutation<T = any, V extends AnyVariables = AnyVariables>(
  query: TypedDocumentNode<T, V> | DocumentNode | string,
  client: Ref<Client> = useClient()
): UseMutationResponse<T, V> {
  const data: Ref<T | undefined> = ref();
  const stale: Ref<boolean> = ref(false);
  const fetching: Ref<boolean> = ref(false);
  const error: Ref<CombinedError | undefined> = ref();
  const operation: Ref<Operation<T, V> | undefined> = ref();
  const extensions: Ref<Record<string, any> | undefined> = ref();

  return {
    data,
    stale,
    fetching,
    error,
    operation,
    extensions,
    executeMutation(
      variables: V,
      context?: Partial<OperationContext>
    ): Promise<OperationResult<T, V>> {
      fetching.value = true;

      return pipe(
        client.value.executeMutation<T, V>(
          createRequest<T, V>(query, unwrapPossibleProxy(variables)),
          context || {}
        ),
        take(1),
        toPromise
      ).then((res: OperationResult<T, V>) => {
        data.value = res.data;
        stale.value = !!res.stale;
        fetching.value = false;
        error.value = res.error;
        operation.value = res.operation;
        extensions.value = res.extensions;
        return res;
      });
    },
  };
}

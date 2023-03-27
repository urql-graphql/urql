import { pipe, map, scan, subscribe } from 'wonka';
import { derived, writable } from 'svelte/store';

import {
  AnyVariables,
  GraphQLRequestParams,
  Client,
  OperationContext,
  createRequest,
} from '@urql/core';

import {
  OperationResultState,
  OperationResultStore,
  initialResult,
} from './common';

/** Input arguments for the {@link mutationStore} function.
 *
 * @param query - The GraphQL mutation that the `mutationStore` executes.
 * @param variables - The variables for the GraphQL mutation that `mutationStore` executes.
 */
export type MutationArgs<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> = {
  /** The {@link Client} using which the subscription will be started.
   *
   * @remarks
   * If you’ve previously provided a {@link Client} on Svelte’s context
   * this can be set to {@link getContextClient}’s return value.
   */
  client: Client;
  /** Updates the {@link OperationContext} for the GraphQL mutation operation.
   *
   * @remarks
   * `context` may be passed to {@link mutationStore}, to update the
   * {@link OperationContext} of a mutation operation. This may be used to update
   * the `context` that exchanges will receive for a single hook.
   *
   * @example
   * ```ts
   * mutationStore({
   *   query,
   *   context: {
   *     additionalTypenames: ['Item'],
   *   },
   * });
   * ```
   */
  context?: Partial<OperationContext>;
} & GraphQLRequestParams<Data, Variables>;

/** Function to create a `mutationStore` that runs a GraphQL mutation and updates with a GraphQL result.
 *
 * @param args - a {@link MutationArgs} object, to pass a `query`, `variables`, and options.
 * @returns a {@link OperationResultStore} of the mutation’s result.
 *
 * @remarks
 * `mutationStore` allows a GraphQL mutation to be defined as a Svelte store.
 * Given {@link MutationArgs.query}, it executes the GraphQL mutation on the
 * {@link MutationArgs.client}.
 *
 * The returned store updates with an {@link OperationResult} when
 * the `Client` returns a result for the mutation.
 *
 * Hint: It’s often easier to use {@link Client.mutation} if you’re
 * creating a mutation imperatively and don’t need a store.
 *
 * @see {@link https://urql.dev/goto/docs/basics/svelte#mutations} for
 * `mutationStore` docs.
 *
 * @example
 * ```ts
 * import { mutationStore, gql, getContextClient } from '@urql/svelte';
 *
 * const client = getContextClient();
 *
 * let result;
 * function updateTodo({ id, title }) {
 *   result = queryStore({
 *     client,
 *     query: gql`
 *       mutation($id: ID!, $title: String!) {
 *         updateTodo(id: $id, title: $title) { id, title }
 *       }
 *     `,
 *     variables: { id, title },
 *   });
 * }
 * ```
 */
export function mutationStore<
  Data = any,
  Variables extends AnyVariables = AnyVariables
>(args: MutationArgs<Data, Variables>): OperationResultStore<Data, Variables> {
  const request = createRequest(args.query, args.variables as Variables);
  const operation = args.client.createRequestOperation(
    'mutation',
    request,
    args.context
  );
  const initialState: OperationResultState<Data, Variables> = {
    ...initialResult,
    operation,
    fetching: true,
  };
  const result$ = writable(initialState);

  const subscription = pipe(
    pipe(
      args.client.executeRequestOperation(operation),
      map(({ stale, data, error, extensions, operation }) => ({
        fetching: false,
        stale,
        data,
        error,
        operation,
        extensions,
      }))
    ),
    scan(
      (result: OperationResultState<Data, Variables>, partial) => ({
        ...result,
        ...partial,
      }),
      initialState
    ),
    subscribe(result => {
      result$.set(result);
    })
  );

  return derived(result$, (result, set) => {
    set(result);
    return subscription.unsubscribe;
  });
}

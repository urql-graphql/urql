import type {
  Client,
  GraphQLRequestParams,
  AnyVariables,
  OperationContext,
  RequestPolicy,
} from '@urql/core';
import { createRequest } from '@urql/core';

import type { Source } from 'wonka';
import {
  pipe,
  map,
  fromValue,
  switchMap,
  subscribe,
  concat,
  scan,
  never,
} from 'wonka';

import { derived, writable } from 'svelte/store';

import type {
  OperationResultState,
  OperationResultStore,
  Pausable,
} from './common';
import { initialResult, createPausable, fromStore } from './common';

/** Input arguments for the {@link queryStore} function.
 *
 * @param query - The GraphQL query that the `queryStore` executes.
 * @param variables - The variables for the GraphQL query that `queryStore` executes.
 */
export type QueryArgs<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
> = {
  /** The {@link Client} using which the query will be executed.
   *
   * @remarks
   * If you’ve previously provided a {@link Client} on Svelte’s context
   * this can be set to {@link getContextClient}’s return value.
   */
  client: Client;
  /** Updates the {@link OperationContext} for the executed GraphQL query operation.
   *
   * @remarks
   * `context` may be passed to {@link queryStore}, to update the {@link OperationContext}
   * of a query operation. This may be used to update the `context` that exchanges
   * will receive for a single hook.
   *
   * @example
   * ```ts
   * queryStore({
   *   query,
   *   context: {
   *     additionalTypenames: ['Item'],
   *   },
   * });
   * ```
   */
  context?: Partial<OperationContext>;
  /** Sets the {@link RequestPolicy} for the executed GraphQL query operation.
   *
   * @remarks
   * `requestPolicy` modifies the {@link RequestPolicy} of the GraphQL query operation
   * that the {@link queryStore} executes, and indicates a caching strategy for cache exchanges.
   *
   * For example, when set to `'cache-and-network'`, the `queryStore` will
   * receive a cached result with `stale: true` and an API request will be
   * sent in the background.
   *
   * @see {@link OperationContext.requestPolicy} for where this value is set.
   */
  requestPolicy?: RequestPolicy;
  /** Prevents the {@link queryStore} from automatically executing GraphQL query operations.
   *
   * @remarks
   * `pause` may be set to `true` to stop the {@link queryStore} from executing
   * automatically. The store will stop receiving updates from the {@link Client}
   * and won’t execute the query operation, until either it’s set to `false`
   * or {@link Pausable.resume} is called.
   *
   * @see {@link https://urql.dev/goto/docs/basics/svelte#pausing-queries} for
   * documentation on the `pause` option.
   */
  pause?: boolean;
} & GraphQLRequestParams<Data, Variables>;

/** Function to create a `queryStore` that runs a GraphQL query and updates with GraphQL results.
 *
 * @param args - a {@link QueryArgs} object, to pass a `query`, `variables`, and options.
 * @returns a {@link OperationResultStore} of query results, which implements {@link Pausable}.
 *
 * @remarks
 * `queryStore` allows GraphQL queries to be defined as Svelte stores.
 * Given {@link QueryArgs.query}, it executes the GraphQL query on the
 * {@link QueryArgs.client}.
 *
 * The returned store updates with {@link OperationResult} values when
 * the `Client` has new results for the query.
 *
 * @see {@link https://urql.dev/goto/docs/basics/svelte#queries} for `queryStore` docs.
 *
 * @example
 * ```ts
 * import { queryStore, gql, getContextClient } from '@urql/svelte';
 *
 * const todos = queryStore({
 *   client: getContextClient(),
 *   query: gql`{ todos { id, title } }`,
 * });
 * ```
 */
export function queryStore<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
>(
  args: QueryArgs<Data, Variables>
): OperationResultStore<Data, Variables> &
  Pausable & { reexecute: (context: Partial<OperationContext>) => void } {
  const request = createRequest(args.query, args.variables as Variables);

  const context: Partial<OperationContext> = {
    requestPolicy: args.requestPolicy,
    ...args.context,
  };

  const operation = args.client.createRequestOperation(
    'query',
    request,
    context
  );

  const operation$ = writable(operation);

  const initialState: OperationResultState<Data, Variables> = {
    ...initialResult,
    operation,
  };

  const isPaused$ = writable(!!args.pause);

  const result$ = writable(initialState, () => {
    return pipe(
      fromStore(isPaused$),
      switchMap(
        (isPaused): Source<Partial<OperationResultState<Data, Variables>>> => {
          if (isPaused) {
            return never as any;
          }

          return pipe(
            fromStore(operation$),
            switchMap(operation => {
              return concat<Partial<OperationResultState<Data, Variables>>>([
                fromValue({ fetching: true, stale: false }),
                pipe(
                  args.client.executeRequestOperation(operation),
                  map(({ stale, data, error, extensions, operation }) => ({
                    fetching: false,
                    stale: !!stale,
                    data,
                    error,
                    operation,
                    extensions,
                  }))
                ),
                fromValue({ fetching: false }),
              ]);
            })
          );
        }
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
    ).unsubscribe;
  });

  const reexecute = (context: Partial<OperationContext>) => {
    const newContext = { ...context, ...args.context };
    const operation = args.client.createRequestOperation(
      'query',
      request,
      newContext
    );
    isPaused$.set(false);
    operation$.set(operation);
  };

  return {
    ...derived(result$, (result, set) => {
      set(result);
    }),
    ...createPausable(isPaused$),
    reexecute,
  };
}

/* eslint-disable react-hooks/rules-of-hooks */

import type { Ref, WatchStopHandle } from 'vue';
import { ref, watchEffect } from 'vue';

import type { Subscription } from 'wonka';
import { pipe, subscribe, onEnd } from 'wonka';

import type {
  Client,
  AnyVariables,
  GraphQLRequestParams,
  CombinedError,
  OperationContext,
  RequestPolicy,
  Operation,
} from '@urql/core';

import { useClient } from './useClient';

import type { MaybeRef, MaybeRefObj } from './utils';
import { useRequestState, useClientState } from './utils';

/** Input arguments for the {@link useQuery} function.
 *
 * @param query - The GraphQL query that `useQuery` executes.
 * @param variables - The variables for the GraphQL query that `useQuery` executes.
 */
export type UseQueryArgs<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
> = {
  /** Updates the {@link RequestPolicy} for the executed GraphQL query operation.
   *
   * @remarks
   * `requestPolicy` modifies the {@link RequestPolicy} of the GraphQL query operation
   * that `useQuery` executes, and indicates a caching strategy for cache exchanges.
   *
   * For example, when set to `'cache-and-network'`, {@link useQuery} will
   * receive a cached result with `stale: true` and an API request will be
   * sent in the background.
   *
   * @see {@link OperationContext.requestPolicy} for where this value is set.
   */
  requestPolicy?: MaybeRef<RequestPolicy>;
  /** Updates the {@link OperationContext} for the executed GraphQL query operation.
   *
   * @remarks
   * `context` may be passed to {@link useQuery}, to update the {@link OperationContext}
   * of a query operation. This may be used to update the `context` that exchanges
   * will receive for a single hook.
   *
   * @example
   * ```ts
   * const result = useQuery({
   *   query,
   *   context: {
   *     additionalTypenames: ['Item'],
   *   },
   * });
   * ```
   */
  context?: MaybeRef<Partial<OperationContext>>;
  /** Prevents {@link useQuery} from automatically executing GraphQL query operations.
   *
   * @remarks
   * `pause` may be set to `true` to stop {@link useQuery} from executing
   * automatically. This will pause the query until {@link UseQueryState.resume}
   * is called, or, if `pause` is a reactive ref of a boolean, until this
   * ref changes to `true`.
   *
   * @see {@link https://urql.dev/goto/docs/basics/vue#pausing-usequery} for
   * documentation on the `pause` option.
   */
  pause?: MaybeRef<boolean>;
} & MaybeRefObj<GraphQLRequestParams<Data, MaybeRefObj<Variables>>>;

/** State of the current query, your {@link useQuery} function is executing.
 *
 * @remarks
 * `UseQueryState` is returned by {@link useQuery} and
 * gives you the updating {@link OperationResult} of
 * GraphQL queries.
 *
 * Each value that is part of the result is wrapped in a reactive ref
 * and updates as results come in.
 *
 * Hint: Even when the query and variables update, the previous state of
 * the last result is preserved, which allows you to display the
 * previous state, while implementing a loading indicator separately.
 */
export interface UseQueryState<T = any, V extends AnyVariables = AnyVariables> {
  /** Indicates whether `useQuery` is waiting for a new result.
   *
   * @remarks
   * When `useQuery` receives a new query and/or variables, it will
   * start executing the new query operation and `fetching` is set to
   * `true` until a result arrives.
   *
   * Hint: This is subtly different than whether the query is actually
   * fetching, and doesn’t indicate whether a query is being re-executed
   * in the background. For this, see {@link UseQueryState.stale}.
   */
  fetching: Ref<boolean>;
  /** Indicates that the state is not fresh and a new result will follow.
   *
   * @remarks
   * The `stale` flag is set to `true` when a new result for the query
   * is expected and `useQuery` is waiting for it. This may indicate that
   * a new request is being requested in the background.
   *
   * @see {@link OperationResult.stale} for the source of this value.
   */
  stale: Ref<boolean>;
  /** Reactive {@link OperationResult.data} for the executed query. */
  data: Ref<T | undefined>;
  /** Reactive {@link OperationResult.error} for the executed query. */
  error: Ref<CombinedError | undefined>;
  /** Reactive {@link OperationResult.extensions} for the executed query. */
  extensions: Ref<Record<string, any> | undefined>;
  /** Reactive {@link Operation} that the current state is for.
   *
   * @remarks
   * This is the {@link Operation} that is currently being executed.
   * When {@link UseQueryState.fetching} is `true`, this is the
   * last `Operation` that the current state was for.
   */
  operation: Ref<Operation<T, V> | undefined>;
  /** Indicates whether {@link useQuery} is currently paused.
   *
   * @remarks
   * When `useQuery` has been paused, it will stop receiving updates
   * from the {@link Client} and won’t execute query operations, until
   * {@link UseQueryArgs.pause} becomes `true` or {@link UseQueryState.resume}
   * is called.
   *
   * @see {@link https://urql.dev/goto/docs/basics/vue#pausing-usequery} for
   * documentation on the `pause` option.
   */
  isPaused: Ref<boolean>;
  /** Resumes {@link useQuery} if it’s currently paused.
   *
   * @remarks
   * Resumes or starts {@link useQuery}’s query, if it’s currently paused.
   *
   * @see {@link https://urql.dev/goto/docs/basics/vue#pausing-usequery} for
   * documentation on the `pause` option.
   */
  resume(): void;
  /** Pauses {@link useQuery} to stop it from executing the query.
   *
   * @remarks
   * Pauses {@link useQuery}’s query, which stops it from receiving updates
   * from the {@link Client} and to stop the ongoing query operation.
   *
   * @see {@link https://urql.dev/goto/docs/basics/vue#pausing-usequery} for
   * documentation on the `pause` option.
   */
  pause(): void;
  /** Triggers {@link useQuery} to execute a new GraphQL query operation.
   *
   * @param opts - optionally, context options that will be merged with
   * {@link UseQueryArgs.context} and the `Client`’s options.
   *
   * @remarks
   * When called, {@link useQuery} will re-execute the GraphQL query operation
   * it currently holds, unless it’s currently paused.
   *
   * This is useful for re-executing a query and get a new network result,
   * by passing a new request policy.
   *
   * ```ts
   * const result = useQuery({ query });
   *
   * const refresh = () => {
   *   // Re-execute the query with a network-only policy, skipping the cache
   *   result.executeQuery({ requestPolicy: 'network-only' });
   * };
   * ```
   */
  executeQuery(opts?: Partial<OperationContext>): UseQueryResponse<T, V>;
}

/** Return value of {@link useQuery}, which is an awaitable {@link UseQueryState}.
 *
 * @remarks
 * {@link useQuery} returns a {@link UseQueryState} but may also be
 * awaited inside a Vue `async setup()` function. If it’s awaited
 * the query is executed before resolving.
 */
export type UseQueryResponse<
  T,
  V extends AnyVariables = AnyVariables,
> = UseQueryState<T, V> & PromiseLike<UseQueryState<T, V>>;

/** Function to run a GraphQL query and get reactive GraphQL results.
 *
 * @param args - a {@link UseQueryArgs} object, to pass a `query`, `variables`, and options.
 * @returns a {@link UseQueryResponse} object.
 *
 * @remarks
 * `useQuery` allows GraphQL queries to be defined and executed inside
 * Vue `setup` functions.
 * Given {@link UseQueryArgs.query}, it executes the GraphQL query with the
 * provided {@link Client}.
 *
 * The returned result’s reactive values update when the `Client` has
 * new results for the query, and changes when your input `args` change.
 *
 * Additionally, `useQuery` may also be awaited inside an `async setup()`
 * function to use Vue’s Suspense feature.
 *
 * @see {@link https://urql.dev/goto/docs/basics/vue#queries} for `useQuery` docs.
 *
 * @example
 * ```ts
 * import { gql, useQuery } from '@urql/vue';
 *
 * const TodosQuery = gql`
 *   query { todos { id, title } }
 * `;
 *
 * export default {
 *   setup() {
 *     const result = useQuery({ query: TodosQuery });
 *     return { data: result.data };
 *   },
 * };
 * ```
 */
export function useQuery<T = any, V extends AnyVariables = AnyVariables>(
  args: UseQueryArgs<T, V>
): UseQueryResponse<T, V> {
  return callUseQuery(args);
}

export function callUseQuery<T = any, V extends AnyVariables = AnyVariables>(
  args: UseQueryArgs<T, V>,
  client: Ref<Client> = useClient(),
  stops?: WatchStopHandle[]
): UseQueryResponse<T, V> {
  const data: Ref<T | undefined> = ref();

  const { fetching, operation, extensions, stale, error } = useRequestState<
    T,
    V
  >();

  const { isPaused, source, pause, resume, execute, teardown } = useClientState(
    args,
    client,
    'executeQuery'
  );

  const teardownQuery = watchEffect(
    onInvalidate => {
      if (source.value) {
        fetching.value = true;
        stale.value = false;

        onInvalidate(
          pipe(
            source.value,
            onEnd(() => {
              fetching.value = false;
              stale.value = false;
            }),
            subscribe(res => {
              data.value = res.data;
              stale.value = !!res.stale;
              fetching.value = false;
              error.value = res.error;
              operation.value = res.operation;
              extensions.value = res.extensions;
            })
          ).unsubscribe
        );
      } else {
        fetching.value = false;
        stale.value = false;
      }
    },
    {
      // NOTE: This part of the query pipeline is only initialised once and will need
      // to do so synchronously
      flush: 'sync',
    }
  );

  stops && stops.push(teardown, teardownQuery);

  const then: UseQueryResponse<T, V>['then'] = (onFulfilled, onRejected) => {
    let sub: Subscription | void;

    const promise = new Promise<UseQueryState<T, V>>(resolve => {
      if (!source.value) {
        return resolve(state);
      }
      let hasResult = false;
      sub = pipe(
        source.value,
        subscribe(() => {
          if (!state.fetching.value && !state.stale.value) {
            if (sub) sub.unsubscribe();
            hasResult = true;
            resolve(state);
          }
        })
      );
      if (hasResult) sub.unsubscribe();
    });

    return promise.then(onFulfilled, onRejected);
  };

  const state: UseQueryState<T, V> = {
    data,
    stale,
    error,
    operation,
    extensions,
    fetching,
    isPaused,
    pause,
    resume,
    executeQuery(opts?: Partial<OperationContext>): UseQueryResponse<T, V> {
      execute(opts);
      return { ...state, then };
    },
  };

  return { ...state, then };
}

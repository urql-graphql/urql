import {
  type AnyVariables,
  type OperationContext,
  type DocumentInput,
  type OperationResult,
  type RequestPolicy,
  createRequest,
} from '@urql/core';
import {
  createComputed,
  createMemo,
  createResource,
  createSignal,
  onCleanup,
} from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { useClient } from './context';
import { type MaybeAccessor, asAccessor } from './utils';
import type { Source, Subscription } from 'wonka';
import { onEnd, pipe, subscribe } from 'wonka';

/** Triggers {@link createQuery} to execute a new GraphQL query operation.
 *
 * @remarks
 * When called, {@link createQuery} will re-execute the GraphQL query operation
 * it currently holds, even if {@link CreateQueryArgs.pause} is set to `true`.
 *
 * This is useful for executing a paused query or re-executing a query
 * and get a new network result, by passing a new request policy.
 *
 * ```ts
 * const [result, reExecuteQuery] = createQuery({ query });
 *
 * const refresh = () => {
 *   // Re-execute the query with a network-only policy, skipping the cache
 *   reExecuteQuery({ requestPolicy: 'network-only' });
 * };
 * ```
 *
 */
export type CreateQueryExecute = (opts?: Partial<OperationContext>) => void;

/** State of the current query, your {@link createQuery} hook is executing.
 *
 * @remarks
 * `CreateQueryState` is returned (in a tuple) by {@link createQuery} and
 * gives you the updating {@link OperationResult} of GraphQL queries.
 *
 * Even when the query and variables passed to {@link createQuery} change,
 * this state preserves the prior state and sets the `fetching` flag to
 * `true`.
 * This allows you to display the previous state, while implementing
 * a separate loading indicator separately.
 */
export type CreateQueryState<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
> = OperationResult<Data, Variables> & {
  /** Indicates whether `createQuery` is waiting for a new result.
   *
   * @remarks
   * When `createQuery` is passed a new query and/or variables, it will
   * start executing the new query operation and `fetching` is set to
   * `true` until a result arrives.
   *
   * Hint: This is subtly different than whether the query is actually
   * fetching, and doesn’t indicate whether a query is being re-executed
   * in the background. For this, see {@link CreateQueryState.stale}.
   */
  fetching: boolean;
};

/**
 * Input arguments for the {@link createQuery} hook.
 */
export type CreateQueryArgs<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
> = {
  /** The GraphQL query that `createQuery` executes. */
  query: DocumentInput<Data, Variables>;

  /** The variables for the GraphQL {@link CreateQueryArgs.query} that `createQuery` executes. */
  variables?: MaybeAccessor<Variables>;

  /** Updates the {@link RequestPolicy} for the executed GraphQL query operation.
   *
   * @remarks
   * `requestPolicy` modifies the {@link RequestPolicy} of the GraphQL query operation
   * that `createQuery` executes, and indicates a caching strategy for cache exchanges.
   *
   * For example, when set to `'cache-and-network'`, {@link createQuery} will
   * receive a cached result with `stale: true` and an API request will be
   * sent in the background.
   *
   * @see {@link OperationContext.requestPolicy} for where this value is set.
   */
  requestPolicy?: MaybeAccessor<RequestPolicy>;

  /** Updates the {@link OperationContext} for the executed GraphQL query operation.
   *
   * @remarks
   * `context` may be passed to {@link createQuery}, to update the {@link OperationContext}
   * of a query operation. This may be used to update the `context` that exchanges
   * will receive for a single hook.
   *
   * In order to re-execute query on context change pass {@link Accessor} instead
   * of raw value.
   */
  context?: MaybeAccessor<Partial<OperationContext>>;

  /** Prevents {@link createQuery} from automatically executing GraphQL query operations.
   *
   * @remarks
   * `pause` may be set to `true` to stop {@link createQuery} from executing
   * automatically. The hook will stop receiving updates from the {@link Client}
   * and won’t execute the query operation, until either it’s set to `false`
   * or the {@link CreateQueryExecute} function is called.
   */
  pause?: MaybeAccessor<boolean>;
};

/** Result tuple returned by the {@link createQuery} hook.
 *
 * @remarks
 * the first element is the {@link createQuery}’s result and state,
 * a {@link CreateQueryState} object,
 * and the second is used to imperatively re-execute the query
 * via a {@link CreateQueryExecute} function.
 */
export type CreateQueryResult<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
> = [CreateQueryState<Data, Variables>, CreateQueryExecute];

/** Hook to run a GraphQL query and get updated GraphQL results.
 *
 * @param args - a {@link CreateQueryArgs} object, to pass a `query`, `variables`, and options.
 * @returns a {@link CreateQueryResult} tuple of a {@link CreateQueryState} result, and re-execute function.
 *
 * @remarks
 * `createQuery` allows GraphQL queries to be defined and executed.
 * Given {@link CreateQueryArgs.query}, it executes the GraphQL query with the
 * context’s {@link Client}.
 *
 * The returned result updates when the `Client` has new results
 * for the query, and changes when your input `args` change.
 *
 * Additionally, if the `suspense` option is enabled on the `Client`,
 * the `createQuery` hook will suspend instead of indicating that it’s
 * waiting for a result via {@link CreateQueryState.fetching}.
 *
 * @example
 * ```tsx
 * import { gql, createQuery } from '@urql/solid';
 *
 * const TodosQuery = gql`
 *   query { todos { id, title } }
 * `;
 *
 * const Todos = () => {
 *   const [result, reExecuteQuery] = createQuery({
 *     query: TodosQuery,
 *   });
 *   // ...
 * };
 * ```
 */
export const createQuery = <
  Data = any,
  Variables extends AnyVariables = AnyVariables,
>(
  args: CreateQueryArgs<Data, Variables>
): CreateQueryResult<Data, Variables> => {
  const client = useClient();
  const getContext = asAccessor(args.context);
  const getPause = asAccessor(args.pause);
  const getRequestPolicy = asAccessor(args.requestPolicy);
  const getVariables = asAccessor(args.variables);

  const [source, setSource] = createSignal<
    Source<OperationResult<Data, Variables>> | undefined
  >(undefined, { equals: false });

  // Combine suspense param coming from context and client with context being priority
  const isSuspense = createMemo(() => {
    const ctx = getContext();
    if (ctx !== undefined && ctx.suspense !== undefined) {
      return ctx.suspense;
    }

    return client.suspense;
  });

  const request = createRequest(args.query, getVariables() as any);
  const context: Partial<OperationContext> = {
    requestPolicy: getRequestPolicy(),
    ...getContext(),
  };
  const operation = client.createRequestOperation('query', request, context);
  const initialResult: CreateQueryState<Data, Variables> = {
    operation: operation,
    fetching: false,
    data: undefined,
    error: undefined,
    extensions: undefined,
    hasNext: false,
    stale: false,
  };

  const [result, setResult] =
    createStore<CreateQueryState<Data, Variables>>(initialResult);

  createComputed(() => {
    if (getPause() === true) {
      setSource(undefined);
      return;
    }

    const request = createRequest(args.query, getVariables() as any);
    const context: Partial<OperationContext> = {
      requestPolicy: getRequestPolicy(),
      ...getContext(),
    };

    setSource(() => client.executeQuery(request, context));
  });

  createComputed(() => {
    const s = source();
    if (s === undefined) {
      setResult(
        produce(draft => {
          draft.fetching = false;
          draft.stale = false;
        })
      );

      return;
    }

    setResult(
      produce(draft => {
        draft.fetching = true;
        draft.stale = false;
      })
    );

    onCleanup(
      pipe(
        s,
        onEnd(() => {
          setResult(
            produce(draft => {
              draft.fetching = false;
              draft.stale = false;
            })
          );
        }),
        subscribe(res => {
          setResult(
            produce(draft => {
              draft.data = res.data;
              draft.stale = !!res.stale;
              draft.fetching = false;
              draft.error = res.error;
              draft.operation = res.operation;
              draft.extensions = res.extensions;
            })
          );
        })
      ).unsubscribe
    );
  });

  const [dataResource, { refetch }] = createResource<
    CreateQueryState<Data, Variables>,
    Source<OperationResult<Data, Variables>> | undefined
  >(source, source => {
    let sub: Subscription | void;
    if (source === undefined) {
      return Promise.resolve(result);
    }

    return new Promise<CreateQueryState<Data, Variables>>(resolve => {
      let hasResult = false;
      sub = pipe(
        source,
        subscribe(() => {
          if (!result.fetching && !result.stale) {
            if (sub) sub.unsubscribe();
            hasResult = true;
            resolve(result);
          }
        })
      );
      if (hasResult) {
        sub.unsubscribe();
      }
    });
  });

  const executeQuery: CreateQueryExecute = opts => {
    const request = createRequest(args.query, getVariables() as any);
    const context: Partial<OperationContext> = {
      requestPolicy: getRequestPolicy(),
      ...getContext(),
      ...opts,
    };

    setSource(() => client.executeQuery(request, context));
    if (isSuspense()) {
      refetch();
    }
  };

  const handler = {
    get(
      target: CreateQueryState<Data, Variables>,
      prop: keyof CreateQueryState<Data, Variables>
    ): any {
      if (isSuspense() && prop === 'data') {
        const resource = dataResource();
        if (resource !== undefined) {
          return resource.data;
        }

        return undefined;
      }

      return Reflect.get(target, prop);
    },
  };

  const proxy = new Proxy(result, handler);
  return [proxy, executeQuery];
};

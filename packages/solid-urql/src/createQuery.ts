import {
  type AnyVariables,
  type OperationContext,
  createRequest,
  type DocumentInput,
  type OperationResult,
  type RequestPolicy,
} from '@urql/core';
import {
  batch,
  createComputed,
  createMemo,
  createResource,
  onCleanup,
} from 'solid-js';
import { createStore, unwrap } from 'solid-js/store';
import { useClient } from './context';
import { asAccessor } from '@solid-primitives/utils';
import {
  concat,
  fromValue,
  makeSubject,
  map,
  never,
  pipe,
  scan,
  subscribe,
  switchMap,
} from 'wonka';
import { type MaybeAccessor } from '@solid-primitives/utils';

export type QueryExecuteArgs<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> = {
  query: DocumentInput<Data, Variables>;
  requestPolicy?: RequestPolicy;
  context?: Partial<OperationContext>;
  pause?: boolean;
  variables?: Variables;
};

/** State of the current query, your {@link createQuery} hook is executing.
 *
 * @remarks
 * `UseQueryState` is returned (in a tuple) by {@link createQuery} and
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
  Variables extends AnyVariables = AnyVariables
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

export type CreateQueryArgs<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> = {
  query: DocumentInput<Data, Variables>;
  requestPolicy?: MaybeAccessor<RequestPolicy>;
  context?: MaybeAccessor<Partial<OperationContext>>;
  pause?: MaybeAccessor<boolean>;
  variables?: MaybeAccessor<Variables>;
};

export const createQuery = <
  Data = any,
  Variables extends AnyVariables = AnyVariables
>(
  args: CreateQueryArgs<Data, Variables>
) => {
  const client = useClient();
  const optionsSubject = makeSubject<QueryExecuteArgs<Data, Variables>>();
  const getContext = asAccessor(args.context),
    getPause = asAccessor(args.pause),
    getRequestPolicy = asAccessor(args.requestPolicy),
    getVariables = asAccessor(args.variables);

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

  const [dataResource, { refetch, mutate }] = createResource<
    CreateQueryState<Data, Variables>
  >(() => {
    return new Promise(resolve => {
      const got = unwrap(result);
      if (got.fetching) {
        return;
      }

      resolve(got);
    });
  });

  const sub = pipe(
    optionsSubject.source,
    switchMap(options$ => {
      if (options$.pause) return never;

      const request = createRequest<Data, AnyVariables>(
        options$.query,
        options$.variables
      );

      return concat<Partial<CreateQueryState<Data, Variables>>>([
        fromValue({ fetching: true, stale: false }),
        pipe(
          client.executeQuery(request, {
            requestPolicy: options$.requestPolicy,
            ...options$.context,
          }),
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
    }),
    scan(
      (result: CreateQueryState<Data, Variables>, partial) => ({
        ...result,
        ...partial,
      }),
      initialResult
    ),
    subscribe(result => {
      batch(() => {
        setResult(result);
        mutate(result);
        refetch();
      });
    })
  );

  createComputed(() => {
    const pause = getPause();
    if (pause === true) {
      return;
    }

    optionsSubject.next({
      query: args.query,
      context: getContext(),
      pause: pause,
      requestPolicy: getRequestPolicy(),
      variables: getVariables(),
    });
  });

  onCleanup(() => sub.unsubscribe());

  batch(() => {
    mutate(() => unwrap(result));
    refetch();
  });

  const refetchFn = (refetchArgs: Partial<OperationContext>) => {
    optionsSubject.next({
      query: args.query,
      requestPolicy: refetchArgs.requestPolicy ?? getRequestPolicy(),
      context: refetchArgs ?? getContext(),
      pause: false,
      variables: getVariables(),
    });
  };

  const handler = {
    get(
      target: CreateQueryState<Data, Variables>,
      prop: keyof CreateQueryState<Data, Variables>
    ): any {
      if (isSuspense() && prop === 'data') {
        return dataResource()?.data;
      }

      return Reflect.get(target, prop);
    },
  };

  const proxy = new Proxy(result, handler);
  return [proxy, refetchFn] as const;
};

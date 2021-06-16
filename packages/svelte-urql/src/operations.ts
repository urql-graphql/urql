import { onDestroy } from 'svelte';

import {
  createRequest,
  stringifyVariables,
  OperationContext,
  OperationResult,
  GraphQLRequest,
  TypedDocumentNode,
} from '@urql/core';

import {
  Source,
  pipe,
  map,
  make,
  scan,
  concat,
  fromValue,
  switchMap,
  subscribe,
} from 'wonka';

import { OperationStore, operationStore } from './operationStore';
import { getClient } from './context';
import { _markStoreUpdate } from './internal';
import { DocumentNode } from 'graphql';

interface SourceRequest<Data = any, Variables = object>
  extends GraphQLRequest<Data, Variables> {
  context?: Partial<OperationContext> & {
    pause?: boolean;
  };
}

const baseState = {
  fetching: false,
  stale: false,
  error: undefined,
  data: undefined,
  extensions: undefined,
};

function toSource<Data, Variables, Result>(
  store: OperationStore<Data, Variables, Result>
) {
  return make<SourceRequest<Data, Variables>>(observer => {
    let $request: void | GraphQLRequest<Data, Variables>;
    let $contextKey: void | string;
    return store.subscribe(state => {
      const request = createRequest<Data, Variables>(
        state.query,
        state.variables!
      ) as SourceRequest<Data, Variables>;

      const contextKey = stringifyVariables((request.context = state.context));

      if (
        $request === undefined ||
        request.key !== $request.key ||
        $contextKey === undefined ||
        contextKey !== $contextKey
      ) {
        $contextKey = contextKey;
        $request = request;
        observer.next(request);
      }
    });
  });
}

export function query<Data = any, Variables = object>(
  store: OperationStore<Data, Variables>
): OperationStore<Data, Variables> {
  const client = getClient();
  const subscription = pipe(
    toSource(store),
    switchMap(request => {
      if (request.context && request.context.pause) {
        return fromValue({ fetching: false, stale: false });
      }

      return concat([
        fromValue({ fetching: true, stale: false }),
        pipe(
          client.executeQuery<Data, Variables>(request, request.context!),
          map(result => ({
            fetching: false,
            ...result,
            stale: !!result.stale,
          }))
        ),
        fromValue({ fetching: false, stale: false }),
      ]);
    }),
    scan(
      (result: Partial<OperationResult<Data, Variables>>, partial) => ({
        ...result,
        ...partial,
      }),
      baseState
    ),
    subscribe(update => {
      _markStoreUpdate(update);
      store.set(update as OperationStore);
    })
  );

  onDestroy(subscription.unsubscribe);
  return store;
}

export type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;

export function subscription<Data = any, Result = Data, Variables = object>(
  store: OperationStore<Data, Variables, Result>,
  handler?: SubscriptionHandler<Data, Result>
): OperationStore<Data, Variables, Result> {
  const client = getClient();
  const subscription = pipe(
    toSource(store),
    switchMap(
      (request): Source<Partial<OperationStore>> => {
        if (request.context && request.context.pause) {
          return fromValue({ fetching: false });
        }

        return concat<Partial<OperationStore>>([
          fromValue({ fetching: true }),
          client.executeSubscription(request, store.context),
          fromValue({ fetching: false }),
        ]);
      }
    ),
    scan(
      (result: Partial<OperationResult<Result, Variables>>, partial: any) => {
        const data =
          partial.data !== undefined
            ? typeof handler === 'function'
              ? handler(result.data, partial.data)
              : partial.data
            : result.data;
        return { ...result, ...partial, data, stale: false };
      },
      baseState
    ),
    subscribe(update => {
      _markStoreUpdate(update);
      store.set(update);
    })
  );

  onDestroy(subscription.unsubscribe);
  return store;
}

export type ExecuteMutation<Data = any, Variables = object> = (
  variables?: Variables,
  context?: Partial<OperationContext>
) => Promise<OperationStore<Data, Variables>>;

interface GraphQLRequestInput<Data = any, Variables = object> {
  key?: number;
  query: DocumentNode | TypedDocumentNode<Data, Variables> | string;
  variables?: Variables;
}

export function mutation<Data = any, Variables = object>(
  input: GraphQLRequestInput<Data, Variables> | OperationStore<Data, Variables>
): ExecuteMutation<Data, Variables> {
  const client = getClient();

  const store =
    typeof (input as any).subscribe !== 'function'
      ? operationStore<Data, Variables>(input.query, input.variables)
      : (input as OperationStore<Data, Variables>);

  return (vars, context) => {
    const update = {
      fetching: true,
      variables: vars || store.variables,
      context: context || store.context,
    };

    _markStoreUpdate(update);
    store.set(update);
    return client
      .mutation(store.query, store.variables as any, store.context)
      .toPromise()
      .then(result => {
        const update = { fetching: false, ...result };
        _markStoreUpdate(update);
        store.set(update);
        return store;
      });
  };
}

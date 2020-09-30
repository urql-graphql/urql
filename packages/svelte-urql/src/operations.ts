import { createRequest, OperationContext, GraphQLRequest } from '@urql/core';
import { onDestroy } from 'svelte';

import {
  pipe,
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

const baseState: Partial<OperationStore> = {
  fetching: false,
  stale: false,
  error: undefined,
  data: undefined,
  extensions: undefined,
};

const isStore = (input: any): input is OperationStore =>
  input && typeof input.subscribe === 'function';

const toStore = (input: GraphQLRequest | OperationStore) =>
  !isStore(input) ? operationStore(input.query, input.variables) : input;

const toSource = (store: OperationStore) => {
  return make<GraphQLRequest>(observer => {
    let $request: void | GraphQLRequest;
    return store.subscribe(state => {
      const request = createRequest(state.query, state.variables as any);
      if (!$request || request.key !== $request.key)
        observer.next(($request = request));
    });
  });
};

export function query<T = any, V = object>(
  input: GraphQLRequest | OperationStore<T, V>,
  context?: Partial<OperationContext>
): OperationStore<T, V> {
  const client = getClient();
  const store = toStore(input);
  const subscription = pipe(
    toSource(store),
    switchMap(request => {
      return concat<Partial<OperationStore>>([
        fromValue({ fetching: true, stale: false }),
        client.executeQuery(request, context),
        fromValue({ fetching: false, stale: false }),
      ]);
    }),
    scan(
      (result, partial) => ({
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

export function subscription<T = any, R = T, V = object>(
  input: GraphQLRequest | OperationStore<T, V>,
  context?: Partial<OperationContext>,
  handler?: SubscriptionHandler<T, R>
): OperationStore<T, V> {
  const client = getClient();
  const store = toStore(input);
  const subscription = pipe(
    toSource(store),
    switchMap(request => {
      return concat<Partial<OperationStore>>([
        fromValue({ fetching: true, stale: false }),
        client.executeSubscription(request, context),
        fromValue({ fetching: false, stale: false }),
      ]);
    }),
    scan((result, partial: any) => {
      const data =
        partial.data !== undefined
          ? typeof handler === 'function'
            ? handler(result.data, partial.data)
            : partial.data
          : result.data;
      return { ...result, ...partial, data };
    }, baseState),
    subscribe(update => {
      _markStoreUpdate(update);
      store.set(update as OperationStore);
    })
  );

  onDestroy(subscription.unsubscribe);
  return store;
}

export type ExecuteMutation<T = any, V = object> = (
  variables?: V,
  context?: Partial<OperationContext>
) => Promise<OperationStore<T, V>>;

export function mutation<T = any, V = object>(
  input: GraphQLRequest | OperationStore<T, V>
): ExecuteMutation<V> {
  const client = getClient();
  const store = toStore(input);

  return (vars, context) => {
    if (vars) store.variables = vars;
    return new Promise(resolve => {
      client
        .mutation(store.query, store.variables, context)
        .toPromise()
        .then(update => {
          _markStoreUpdate(update);
          store.set(update as any);
          resolve(store);
        });
    });
  };
}

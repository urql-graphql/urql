import { onDestroy } from 'svelte';

import {
  createRequest,
  stringifyVariables,
  OperationContext,
  GraphQLRequest,
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

interface SourceRequest extends GraphQLRequest {
  context?: Partial<OperationContext> & {
    pause?: boolean;
  };
}

const baseState: Partial<OperationStore> = {
  fetching: false,
  stale: false,
  error: undefined,
  data: undefined,
  extensions: undefined,
};

const toSource = (store: OperationStore) => {
  return make<SourceRequest>(observer => {
    let $request: void | GraphQLRequest;
    let $contextKey: void | string;
    return store.subscribe(state => {
      const request = createRequest(
        state.query,
        state.variables as any
      ) as SourceRequest;

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
};

export function query<T = any, V = object>(
  store: OperationStore<T, V>
): OperationStore<T, V> {
  const client = getClient();
  const subscription = pipe(
    toSource(store),
    switchMap(
      (request): Source<Partial<OperationStore>> => {
        if (request.context && request.context.pause) {
          return fromValue({ fetching: false, stale: false });
        }

        return concat<Partial<OperationStore>>([
          fromValue({ fetching: true, stale: false }),
          pipe(
            client.executeQuery(request, request.context!),
            map(result => ({
              fetching: false,
              ...result,
              stale: !!result.stale,
            }))
          ),
          fromValue({ fetching: false, stale: false }),
        ]);
      }
    ),
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
  store: OperationStore<T, V>,
  handler?: SubscriptionHandler<T, R>
): OperationStore<T, V> {
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
    scan((result, partial: any) => {
      const data =
        partial.data !== undefined
          ? typeof handler === 'function'
            ? handler(result.data, partial.data)
            : partial.data
          : result.data;
      return { ...result, ...partial, data, stale: false };
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

  const store =
    typeof (input as any).subscribe !== 'function'
      ? operationStore(input.query, input.variables)
      : (input as OperationStore);

  return (vars, context) => {
    const update = {
      fetching: true,
      variables: vars || store.variables,
      context: context || store.context,
    };

    _markStoreUpdate(update);
    store.set(update);

    return new Promise(resolve => {
      client
        .mutation(store.query, store.variables, store.context)
        .toPromise()
        .then(result => {
          const update = { fetching: false, ...result };
          _markStoreUpdate(update);
          store.set(update);
          resolve(store);
        });
    });
  };
}

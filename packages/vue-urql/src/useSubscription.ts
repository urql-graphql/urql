import { inject, Ref, unref, ref, isRef, watchEffect } from 'vue';
import { DocumentNode } from 'graphql';
import { pipe, subscribe, onEnd } from 'wonka';

import {
  TypedDocumentNode,
  CombinedError,
  OperationContext,
  Operation,
  Client,
  createRequest,
  GraphQLRequest,
} from '@urql/core';

type MaybeRef<T> = T | Ref<T>;

export interface UseSubscriptionArgs<T = any, V = object> {
  query: MaybeRef<TypedDocumentNode<T, V> | DocumentNode | string>;
  variables?: MaybeRef<V>;
  pause?: MaybeRef<boolean>;
  context?: MaybeRef<Partial<OperationContext>>;
}

export type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;

export interface UseSubscriptionState<T = any, R = T, V = object> {
  fetching: Ref<boolean>;
  stale: Ref<boolean>;
  data: Ref<R | undefined>;
  error: Ref<CombinedError | undefined>;
  extensions: Ref<Record<string, any> | undefined>;
  operation: Ref<Operation<T, V> | undefined>;
  isPaused: Ref<boolean>;
  resume(): void;
  pause(): void;
  executeSubscription(opts?: Partial<OperationContext>): void;
}

export type UseSubscriptionResponse<
  T = any,
  R = T,
  V = object
> = UseSubscriptionState<T, R, V>;

export function useSubscription<T = any, R = T, V = object>(
  args: UseSubscriptionArgs<T, V>,
  handler?: MaybeRef<SubscriptionHandler<T, R>>
): UseSubscriptionResponse<T, R, V> {
  const client = inject('$urql') as Client;

  if (process.env.NODE_ENV !== 'production' && !client) {
    throw new Error(
      'Cannot detect urql Client, did you forget to call `useClient`?'
    );
  }

  const data: Ref<R | undefined> = ref();
  const stale: Ref<boolean> = ref(false);
  const fetching: Ref<boolean> = ref(false);
  const error: Ref<CombinedError | undefined> = ref();
  const operation: Ref<Operation | undefined> = ref();
  const extensions: Ref<Record<string, any> | undefined> = ref();

  const unsubscribe: Ref<() => void> = ref(() => {
    /* noop */
  });

  const scanHandler: Ref<SubscriptionHandler<T, R> | undefined> = isRef(handler)
    ? handler
    : ref(handler);

  const isPaused: Ref<boolean> = isRef(args.pause)
    ? args.pause
    : ref(!!args.pause);

  const request: Ref<GraphQLRequest<T, V>> = ref(
    createRequest<T, V>(unref(args.query), unref(args.variables) as V) as any
  );

  watchEffect(
    () => {
      const newRequest = createRequest<T, V>(
        unref(args.query),
        unref(args.variables) as any
      );
      if (request.value.key !== newRequest.key) {
        request.value = newRequest;
      }
    },
    {
      flush: 'sync',
    }
  );

  const executeSubscription = (opts?: Partial<OperationContext>) => {
    fetching.value = true;

    unsubscribe.value();
    unsubscribe.value = pipe(
      client.executeSubscription<T, V>(request.value, {
        ...unref(args.context),
        ...opts,
      }),
      onEnd(() => {
        fetching.value = false;
      }),
      subscribe(result => {
        fetching.value = true;
        (data.value =
          result.data !== undefined
            ? typeof scanHandler.value === 'function'
              ? scanHandler.value(data.value as any, result.data!)
              : result.data
            : (result.data as any)),
          (error.value = result.error);
        extensions.value = result.extensions;
        stale.value = !!result.stale;
        operation.value = result.operation;
      })
    ).unsubscribe;
  };

  watchEffect(
    onInvalidate => {
      if (!isPaused.value) {
        executeSubscription();
        onInvalidate(() => {
          unsubscribe.value();
        });
      }
    },
    {
      flush: 'pre',
    }
  );

  return {
    data,
    stale,
    error,
    operation,
    extensions,
    fetching,
    executeSubscription,
    isPaused,
    pause() {
      isPaused.value = true;
    },
    resume() {
      isPaused.value = false;
    },
  };
}

import { Ref, ref, watchEffect, reactive, isRef } from 'vue';
import { DocumentNode } from 'graphql';
import { Source, pipe, publish, share, onStart, onPush, onEnd } from 'wonka';

import {
  OperationResult,
  TypedDocumentNode,
  CombinedError,
  OperationContext,
  Operation,
  createRequest,
  GraphQLRequest,
  Client,
} from '@urql/core';

import { useClient } from './useClient';

type MaybeRef<T> = T | Ref<T>;

export interface UseSubscriptionArgs<T = any, V = object> {
  query: MaybeRef<TypedDocumentNode<T, V> | DocumentNode | string>;
  variables?: MaybeRef<V>;
  pause?: MaybeRef<boolean>;
  context?: MaybeRef<Partial<OperationContext>>;
  client?: Client;
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

const watchOptions = {
  flush: 'pre' as const,
};

export function useSubscription<T = any, R = T, V = object>(
  _args: UseSubscriptionArgs<T, V>,
  handler?: MaybeRef<SubscriptionHandler<T, R>>
): UseSubscriptionResponse<T, R, V> {
  const args = reactive(_args);
  const client = _args.client || useClient(); // eslint-disable-line react-hooks/rules-of-hooks

  const data: Ref<R | undefined> = ref();
  const stale: Ref<boolean> = ref(false);
  const fetching: Ref<boolean> = ref(false);
  const error: Ref<CombinedError | undefined> = ref();
  const operation: Ref<Operation | undefined> = ref();
  const extensions: Ref<Record<string, any> | undefined> = ref();

  const scanHandler: Ref<SubscriptionHandler<T, R> | undefined> = ref(handler);

  const isPaused: Ref<boolean> = isRef(_args.pause)
    ? _args.pause
    : ref(!!_args.pause);

  const request: Ref<GraphQLRequest<T, V>> = ref(
    createRequest<T, V>(args.query, args.variables as V) as any
  );

  const source: Ref<Source<OperationResult<T, V>> | undefined> = ref();

  watchEffect(() => {
    const newRequest = createRequest<T, V>(args.query, args.variables as any);
    if (request.value.key !== newRequest.key) {
      request.value = newRequest;
    }
  }, watchOptions);

  watchEffect(() => {
    if (!isPaused.value) {
      source.value = pipe(
        client.executeSubscription<T, V>(request.value, {
          ...args.context,
        }),
        share
      );
    } else {
      source.value = undefined;
    }
  }, watchOptions);

  watchEffect(onInvalidate => {
    if (source.value) {
      onInvalidate(
        pipe(
          source.value,
          onStart(() => {
            fetching.value = true;
          }),
          onEnd(() => {
            fetching.value = false;
          }),
          onPush(result => {
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
          }),
          publish
        ).unsubscribe
      );
    }
  }, watchOptions);

  const state: UseSubscriptionState<T, R, V> = {
    data,
    stale,
    error,
    operation,
    extensions,
    fetching,
    isPaused,
    executeSubscription(
      opts?: Partial<OperationContext>
    ): UseSubscriptionState<T, R, V> {
      source.value = pipe(
        client.executeSubscription<T, V>(request.value, {
          ...args.context,
          ...opts,
        }),
        share
      );

      return state;
    },
    pause() {
      isPaused.value = true;
    },
    resume() {
      isPaused.value = false;
    },
  };

  return state;
}

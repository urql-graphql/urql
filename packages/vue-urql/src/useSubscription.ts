/* eslint-disable react-hooks/rules-of-hooks */

import { DocumentNode } from 'graphql';
import { Source, pipe, subscribe, onEnd } from 'wonka';

import { WatchStopHandle, Ref, ref, watchEffect, reactive, isRef } from 'vue';

import {
  Client,
  AnyVariables,
  OperationResult,
  TypedDocumentNode,
  CombinedError,
  OperationContext,
  Operation,
  createRequest,
  GraphQLRequest,
} from '@urql/core';

import { useClient } from './useClient';
import { unwrapPossibleProxy } from './utils';

type MaybeRef<T> = T | Ref<T>;

export type UseSubscriptionArgs<
  T = any,
  V extends AnyVariables = AnyVariables
> = {
  query: MaybeRef<TypedDocumentNode<T, V> | DocumentNode | string>;
  pause?: MaybeRef<boolean>;
  context?: MaybeRef<Partial<OperationContext>>;
} & (V extends void
  ? {
      variables?: MaybeRef<{ [K in keyof V]: MaybeRef<V[K]> }>;
    }
  : V extends { [P in keyof V]: V[P] | null }
  ? { variables?: MaybeRef<{ [K in keyof V]: MaybeRef<V[K]> }> }
  : {
      variables: MaybeRef<{ [K in keyof V]: MaybeRef<V[K]> }>;
    });

export type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;
export type SubscriptionHandlerArg<T, R> = MaybeRef<SubscriptionHandler<T, R>>;

export interface UseSubscriptionState<
  T = any,
  R = T,
  V extends AnyVariables = AnyVariables
> {
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

export function useSubscription<
  T = any,
  R = T,
  V extends AnyVariables = AnyVariables
>(
  args: UseSubscriptionArgs<T, V>,
  handler?: SubscriptionHandlerArg<T, R>
): UseSubscriptionResponse<T, R, V> {
  return callUseSubscription(args, handler);
}

export function callUseSubscription<
  T = any,
  R = T,
  V extends AnyVariables = AnyVariables
>(
  _args: UseSubscriptionArgs<T, V>,
  handler?: SubscriptionHandlerArg<T, R>,
  client: Ref<Client> = useClient(),
  stops: WatchStopHandle[] = []
): UseSubscriptionResponse<T, R, V> {
  const args = reactive(_args);

  const data: Ref<R | undefined> = ref();
  const stale: Ref<boolean> = ref(false);
  const fetching: Ref<boolean> = ref(false);
  const error: Ref<CombinedError | undefined> = ref();
  const operation: Ref<Operation<T, V> | undefined> = ref();
  const extensions: Ref<Record<string, any> | undefined> = ref();

  const scanHandler: Ref<SubscriptionHandler<T, R> | undefined> = ref(handler);

  const isPaused: Ref<boolean> = isRef(_args.pause)
    ? _args.pause
    : ref(!!_args.pause);

  const request: Ref<GraphQLRequest<T, V>> = ref(
    createRequest<T, V>(
      args.query,
      unwrapPossibleProxy<V>(args.variables as V)
    ) as any
  );

  const source: Ref<Source<OperationResult<T, V>> | undefined> = ref();

  stops.push(
    watchEffect(() => {
      const newRequest = createRequest<T, V>(
        args.query,
        unwrapPossibleProxy<V>(args.variables as V)
      );
      if (request.value.key !== newRequest.key) {
        request.value = newRequest;
      }
    }, watchOptions)
  );

  stops.push(
    watchEffect(() => {
      source.value = !isPaused.value
        ? client.value.executeSubscription<T, V>(request.value, {
            ...args.context,
          })
        : undefined;
    }, watchOptions)
  );

  stops.push(
    watchEffect(onInvalidate => {
      if (source.value) {
        fetching.value = true;

        onInvalidate(
          pipe(
            source.value,
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
          ).unsubscribe
        );
      } else {
        fetching.value = false;
      }
    }, watchOptions)
  );

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
      source.value = client.value.executeSubscription<T, V>(request.value, {
        ...args.context,
        ...opts,
      });

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

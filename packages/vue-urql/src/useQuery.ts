/* eslint-disable react-hooks/rules-of-hooks */

import { WatchStopHandle, Ref, ref, watchEffect, reactive, isRef } from 'vue';

import { Subscription, Source, pipe, subscribe, onEnd } from 'wonka';

import {
  Client,
  AnyVariables,
  OperationResult,
  GraphQLRequestParams,
  CombinedError,
  OperationContext,
  RequestPolicy,
  Operation,
  createRequest,
  GraphQLRequest,
} from '@urql/core';

import { useClient } from './useClient';
import { unwrapPossibleProxy } from './utils';

type MaybeRefObj<T extends {}> = {
  [K in keyof T]: T[K] | Ref<T[K]>;
};

export type UseQueryArgs<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> = MaybeRefObj<
  {
    requestPolicy?: RequestPolicy;
    context?: Partial<OperationContext>;
    pause?: boolean;
  } & GraphQLRequestParams<Data, Variables>
>;

export type QueryPartialState<
  T = any,
  V extends AnyVariables = AnyVariables
> = Partial<OperationResult<T, V>> & { fetching?: boolean };

export interface UseQueryState<T = any, V extends AnyVariables = AnyVariables> {
  fetching: Ref<boolean>;
  stale: Ref<boolean>;
  data: Ref<T | undefined>;
  error: Ref<CombinedError | undefined>;
  extensions: Ref<Record<string, any> | undefined>;
  operation: Ref<Operation<T, V> | undefined>;
  isPaused: Ref<boolean>;
  resume(): void;
  pause(): void;
  executeQuery(opts?: Partial<OperationContext>): UseQueryResponse<T, V>;
}

export type UseQueryResponse<
  T,
  V extends AnyVariables = AnyVariables
> = UseQueryState<T, V> & PromiseLike<UseQueryState<T, V>>;

const watchOptions = {
  flush: 'pre' as const,
};

export function useQuery<T = any, V extends AnyVariables = AnyVariables>(
  args: UseQueryArgs<T, V>
): UseQueryResponse<T, V> {
  return callUseQuery(args);
}

export function callUseQuery<T = any, V extends AnyVariables = AnyVariables>(
  _args: UseQueryArgs<T, V>,
  client: Ref<Client> = useClient(),
  stops: WatchStopHandle[] = []
): UseQueryResponse<T, V> {
  const args = reactive(_args);

  const data: Ref<T | undefined> = ref();
  const stale: Ref<boolean> = ref(false);
  const fetching: Ref<boolean> = ref(false);
  const error: Ref<CombinedError | undefined> = ref();
  const operation: Ref<Operation<T, V> | undefined> = ref();
  const extensions: Ref<Record<string, any> | undefined> = ref();

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
        ? client.value.executeQuery<T, V>(request.value, {
            requestPolicy: args.requestPolicy,
            ...args.context,
          })
        : undefined;
    }, watchOptions)
  );

  const state: UseQueryState<T, V> = {
    data,
    stale,
    error,
    operation,
    extensions,
    fetching,
    isPaused,
    executeQuery(opts?: Partial<OperationContext>): UseQueryResponse<T, V> {
      const s = (source.value = client.value.executeQuery<T, V>(request.value, {
        requestPolicy: args.requestPolicy,
        ...args.context,
        ...opts,
      }));

      return {
        ...response,
        then(onFulfilled, onRejected) {
          let sub: Subscription | void;
          return new Promise<UseQueryState<T, V>>(resolve => {
            let hasResult = false;
            sub = pipe(
              s,
              subscribe(() => {
                if (!state.fetching.value && !state.stale.value) {
                  if (sub) sub.unsubscribe();
                  hasResult = true;
                  resolve(state);
                }
              })
            );
            if (hasResult) sub.unsubscribe();
          }).then(onFulfilled, onRejected);
        },
      };
    },
    pause() {
      isPaused.value = true;
    },
    resume() {
      isPaused.value = false;
    },
  };

  stops.push(
    watchEffect(
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
    )
  );

  const response: UseQueryResponse<T, V> = {
    ...state,
    then(onFulfilled, onRejected) {
      let sub: Subscription | void;
      const promise = new Promise<UseQueryState<T, V>>(resolve => {
        if (!source.value) return resolve(state);
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
    },
  };

  return response;
}

import { Ref, ref, watch, reactive, isRef } from 'vue';
import { DocumentNode } from 'graphql';

import {
  Source,
  concat,
  fromValue,
  map,
  pipe,
  take,
  publish,
  share,
  onStart,
  onPush,
  toPromise,
  onEnd,
} from 'wonka';

import {
  OperationResult,
  TypedDocumentNode,
  CombinedError,
  OperationContext,
  RequestPolicy,
  Operation,
  createRequest,
  GraphQLRequest,
} from '@urql/core';

import { useClient } from './useClient';

type MaybeRef<T> = T | Ref<T>;

export interface UseQueryArgs<T = any, V = object> {
  query: MaybeRef<TypedDocumentNode<T, V> | DocumentNode | string>;
  variables?: MaybeRef<V>;
  requestPolicy?: MaybeRef<RequestPolicy>;
  pollInterval?: MaybeRef<number>;
  context?: MaybeRef<Partial<OperationContext>>;
  pause?: MaybeRef<boolean>;
}

export interface UseQueryState<T = any, V = object> {
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

export type UseQueryResponse<T, V> = UseQueryState<T, V> &
  PromiseLike<UseQueryState<T, V>>;

const noop = () => {
  /* noop */
};

export function useQuery<T = any, V = object>(
  _args: UseQueryArgs<T, V>
): UseQueryResponse<T, V> {
  const args = reactive(_args);
  const client = useClient();

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
    createRequest<T, V>(args.query, args.variables as V) as any
  );

  const source: Ref<Source<OperationResult<T, V>> | undefined> = ref();
  const unsubscribe: Ref<() => void> = ref(noop);

  watch(
    [args.query, args.variables],
    () => {
      const newRequest = createRequest<T, V>(args.query, args.variables as any);
      if (request.value.key !== newRequest.key) {
        request.value = newRequest;
      }
    },
    {
      immediate: true,
      flush: 'sync',
    }
  );

  watch(
    [isPaused, request, args.requestPolicy, args.pollInterval, args.context],
    () => {
      if (!isPaused.value) {
        source.value = pipe(
          client.executeQuery<T, V>(request.value, {
            requestPolicy: args.requestPolicy,
            pollInterval: args.pollInterval,
            ...args.context,
          }),
          share
        );
      } else {
        source.value = undefined;
      }
    },
    {
      immediate: true,
      flush: 'sync',
    }
  );

  watch(
    [source],
    (_, __, onInvalidate) => {
      if (!source.value) {
        return unsubscribe.value();
      }

      let cached: OperationResult<T, V> | undefined;

      unsubscribe.value = pipe(
        cached ? concat([fromValue(cached), source.value]) : source.value,
        onStart(() => {
          fetching.value = true;
        }),
        onEnd(() => {
          fetching.value = false;
        }),
        onPush(res => {
          cached = res;
          data.value = res.data;
          stale.value = !!res.stale;
          fetching.value = false;
          error.value = res.error;
          operation.value = res.operation;
          extensions.value = res.extensions;
        }),
        publish
      ).unsubscribe;

      onInvalidate(() => {
        cached = undefined;
        unsubscribe.value();
      });
    },
    {
      immediate: true,
      flush: 'pre',
    }
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
      source.value = pipe(
        client.executeQuery<T, V>(request.value, {
          requestPolicy: args.requestPolicy,
          pollInterval: args.pollInterval,
          ...args.context,
          ...opts,
        }),
        share
      );

      return response;
    },
    pause() {
      isPaused.value = true;
    },
    resume() {
      isPaused.value = false;
    },
  };

  const response: UseQueryResponse<T, V> = {
    ...state,
    then(onFulfilled, onRejected) {
      let result$: Promise<UseQueryState<T, V>>;
      if (fetching.value && source.value) {
        result$ = pipe(
          source.value,
          take(1),
          map(() => state),
          toPromise
        );
      } else {
        result$ = Promise.resolve(state);
      }

      return result$.then(onFulfilled, onRejected);
    },
  };

  return response;
}

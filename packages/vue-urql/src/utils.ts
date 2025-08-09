import type {
  AnyVariables,
  Client,
  CombinedError,
  DocumentInput,
  GraphQLRequest,
  Operation,
  OperationContext,
  OperationResult,
  OperationResultSource,
} from '@urql/core';
import { createRequest } from '@urql/core';
import { type Ref, unref } from 'vue';
import { watchEffect, isReadonly, computed, ref, shallowRef, isRef } from 'vue';
import type { UseSubscriptionArgs } from './useSubscription';
import type { UseQueryArgs } from './useQuery';

export type MaybeRefOrGetter<T> = T | (() => T) | Ref<T>;
export type MaybeRefOrGetterObj<T extends {}> =
  T extends Record<string, never>
    ? T
    : { [K in keyof T]: MaybeRefOrGetter<T[K]> };

const isFunction = <T>(val: MaybeRefOrGetter<T>): val is () => T =>
  typeof val === 'function';

const toValue = <T>(source: MaybeRefOrGetter<T>): T =>
  isFunction(source) ? source() : unref(source);

export const createRequestWithArgs = <
  T = any,
  V extends AnyVariables = AnyVariables,
>(
  args:
    | UseQueryArgs<T, V>
    | UseSubscriptionArgs<T, V>
    | { query: MaybeRefOrGetter<DocumentInput<T, V>>; variables: V }
): GraphQLRequest<T, V> => {
  const _args = toValue(args);
  return createRequest<T, V>(
    toValue(_args.query),
    toValue(_args.variables as MaybeRefOrGetter<V>)
  );
};

export const useRequestState = <
  T = any,
  V extends AnyVariables = AnyVariables,
>() => {
  const hasNext: Ref<boolean> = ref(false);
  const stale: Ref<boolean> = ref(false);
  const fetching: Ref<boolean> = ref(false);
  const error: Ref<CombinedError | undefined> = shallowRef();
  const operation: Ref<Operation<T, V> | undefined> = shallowRef();
  const extensions: Ref<Record<string, any> | undefined> = shallowRef();
  return {
    hasNext,
    stale,
    fetching,
    error,
    operation,
    extensions,
  };
};

export function useClientState<T = any, V extends AnyVariables = AnyVariables>(
  args: UseQueryArgs<T, V> | UseSubscriptionArgs<T, V>,
  client: Ref<Client>,
  method: keyof Pick<Client, 'executeSubscription' | 'executeQuery'>
) {
  const source: Ref<OperationResultSource<OperationResult<T, V>> | undefined> =
    shallowRef();

  const isPaused: Ref<boolean> = isRef(args.pause)
    ? args.pause
    : typeof args.pause === 'function'
      ? computed(args.pause)
      : ref(!!args.pause);

  const request = computed(() => createRequestWithArgs<T, V>(args));

  const requestOptions = computed(() => {
    return 'requestPolicy' in args
      ? {
          requestPolicy: toValue(args.requestPolicy),
          ...toValue(args.context),
        }
      : {
          ...toValue(args.context),
        };
  });

  const pause = () => {
    if (!isReadonly(isPaused)) {
      isPaused.value = true;
    }
  };

  const resume = () => {
    if (!isReadonly(isPaused)) {
      isPaused.value = false;
    }
  };

  const executeRaw = (opts?: Partial<OperationContext>) => {
    return client.value[method]<T, V>(request.value, {
      ...requestOptions.value,
      ...opts,
    });
  };

  const execute = (opts?: Partial<OperationContext>) => {
    source.value = executeRaw(opts);
  };

  // it's important to use `watchEffect()` here instead of `watch()`
  // because it listening for reactive variables inside `executeRaw()` function
  const teardown = watchEffect(() => {
    source.value = !isPaused.value ? executeRaw() : undefined;
  });

  return {
    source,
    isPaused,
    pause,
    resume,
    execute,
    teardown,
  };
}

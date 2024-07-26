import type {
  AnyVariables,
  Client,
  CombinedError,
  DocumentInput,
  Operation,
  OperationContext,
  OperationResult,
  OperationResultSource,
} from '@urql/core';
import { createRequest } from '@urql/core';
import type { Ref } from 'vue';
import { watchEffect, isReadonly, computed, ref, shallowRef, isRef } from 'vue';
import type { UseSubscriptionArgs } from './useSubscription';
import type { UseQueryArgs } from './useQuery';

export type MaybeRef<T> = T | (() => T) | Ref<T>;
export type MaybeRefObj<T> = T extends {}
  ? { [K in keyof T]: MaybeRef<T[K]> }
  : T;

const unwrap = <T>(maybeRef: MaybeRef<T>): T =>
  typeof maybeRef === 'function'
    ? (maybeRef as () => T)()
    : maybeRef != null && isRef(maybeRef)
    ? maybeRef.value
    : maybeRef;

const _toString = Object.prototype.toString;
const isPlainObject = (value: any): boolean => {
  if (typeof value !== 'object' || value === null) return false;

  if (_toString.call(value) !== '[object Object]') return false;

  return (
    value.constructor &&
    Object.getPrototypeOf(value).constructor === Object.prototype.constructor
  );
};
export const isArray = Array.isArray;

const unwrapDeeply = <T>(input: T): T => {
  input = isRef(input) ? (input.value as T) : input;

  if (typeof input === 'function') {
    return unwrapDeeply(input()) as T;
  }

  if (input && typeof input === 'object') {
    if (isArray(input)) {
      const length = input.length;
      const out = new Array(length) as T;
      let i = 0;
      for (; i < length; i++) {
        out[i] = unwrapDeeply(input[i]);
      }

      return out;
    } else if (isPlainObject(input)) {
      const keys = Object.keys(input);
      const length = keys.length;
      let i = 0;
      let key: string;
      const out = {} as T;

      for (; i < length; i++) {
        key = keys[i];
        out[key] = unwrapDeeply(input[key]);
      }

      return out;
    }
  }

  return input;
};

export const createRequestWithArgs = <
  T = any,
  V extends AnyVariables = AnyVariables,
>(
  args:
    | UseQueryArgs<T, V>
    | UseSubscriptionArgs<T, V>
    | { query: MaybeRef<DocumentInput<T, V>>; variables: V }
) => {
  return createRequest<T, V>(
    unwrap(args.query),
    unwrapDeeply(args.variables) as V
  );
};

export const useRequestState = <
  T = any,
  V extends AnyVariables = AnyVariables,
>() => {
  const stale: Ref<boolean> = ref(false);
  const fetching: Ref<boolean> = ref(false);
  const error: Ref<CombinedError | undefined> = shallowRef();
  const operation: Ref<Operation<T, V> | undefined> = shallowRef();
  const extensions: Ref<Record<string, any> | undefined> = shallowRef();
  return {
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

  const request = computed(() => createRequestWithArgs(args));

  const requestOptions = computed(() => {
    return 'requestPolicy' in args
      ? {
          requestPolicy: unwrap(args.requestPolicy),
          ...unwrap(args.context),
        }
      : {
          ...unwrap(args.context),
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

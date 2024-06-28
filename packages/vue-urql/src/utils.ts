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
import {
  watchEffect,
  isReadonly,
  computed,
  readonly,
  ref,
  shallowRef,
  isRef,
} from 'vue';
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

export const createRequestWithArgs = <
  T = any,
  V extends AnyVariables = AnyVariables,
>(
  args:
    | UseQueryArgs<T, V>
    | UseSubscriptionArgs<T, V>
    | { query: MaybeRef<DocumentInput<T, V>>; variables: V }
) => {
  let vars = unwrap(args.variables);
  // unwrap possible nested reactive variables with `readonly()`
  if (vars) {
    for (const prop in vars) {
      if ((Object.hasOwn || Object.prototype.hasOwnProperty.call)(vars, prop)) {
        const value = vars[prop];
        if (value && (typeof value === 'object' || isRef(value))) {
          vars = readonly(vars);
          break;
        }
      }
    }
  }
  return createRequest<T, V>(unwrap(args.query), vars as V);
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

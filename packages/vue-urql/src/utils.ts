import type {
  AnyVariables,
  Client,
  CombinedError,
  Operation,
  OperationContext,
  OperationResult,
} from '@urql/core';
import { createRequest } from '@urql/core';
import type { Ref } from 'vue';
import { watchEffect } from 'vue';
import { isReadonly } from 'vue';
import { computed, readonly, ref, shallowRef } from 'vue';
import { isRef } from 'vue';
import type { Source } from 'wonka';
import type { UseSubscriptionArgs } from './useSubscription';
import type { UseQueryArgs } from './useQuery';

export type MaybeRef<T> = T | (() => T) | Ref<T>;
export type MaybeRefObj<T> = T extends {}
  ? { [K in keyof T]: MaybeRef<T[K]> }
  : T;

export const unref = <T>(maybeRef: MaybeRef<T>): T =>
  typeof maybeRef === 'function'
    ? (maybeRef as () => T)()
    : maybeRef != null && isRef(maybeRef)
    ? maybeRef.value
    : maybeRef;

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
  const source: Ref<Source<OperationResult<T, V>> | undefined> = shallowRef();

  const isPaused: Ref<boolean> = isRef(args.pause)
    ? args.pause
    : typeof args.pause === 'function'
    ? computed(args.pause)
    : ref(!!args.pause);

  const request = computed(() => {
    let vars = unref(args.variables);
    // unwrap possible nested reactive variables with `readonly()`
    for (const prop in vars) {
      if (Object.hasOwn(vars, prop)) {
        if (isRef(vars[prop])) {
          vars = readonly(vars);
          break;
        }
      }
    }
    return createRequest<T, V>(unref(args.query), vars as V);
  });

  const requestOptions = computed(() => {
    return 'requestPolicy' in args
      ? {
          requestPolicy: unref(args.requestPolicy),
          ...unref(args.context),
        }
      : {
          ...unref(args.context),
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

  const execute = (opts?: Partial<OperationContext>) => {
    return client.value[method]<T, V>(request.value, {
      ...requestOptions.value,
      ...opts,
    });
  };

  // it's important to use `watchEffect()` here instead of `watch()`
  // because it listening for reactive variables inside `execute()` function
  watchEffect(() => {
    source.value = !isPaused.value ? execute() : undefined;
  });

  return {
    source,
    isPaused,
    pause,
    resume,
    execute,
  };
}

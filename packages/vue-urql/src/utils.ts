import type { GraphQLRequest, AnyVariables } from '@urql/core';
import type { Ref, ShallowRef } from 'vue';
import { isRef } from 'vue';

export type MaybeRef<T> = T | (() => T) | Ref<T>;
export type MaybeRefObj<T extends {}> = { [K in keyof T]: MaybeRef<T[K]> };

export const unref = <T>(maybeRef: MaybeRef<T>): T =>
  typeof maybeRef === 'function'
    ? (maybeRef as () => T)()
    : maybeRef != null && isRef(maybeRef)
    ? maybeRef.value
    : maybeRef;

export interface RequestState<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
> {
  request: GraphQLRequest<Data, Variables>;
  isPaused: boolean;
}

export function createRequestState<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
>(
  request: GraphQLRequest<Data, Variables>,
  isPaused: boolean
): RequestState<Data, Variables> {
  return { request, isPaused };
}

export const updateShallowRef = <T extends Record<string, any>>(
  ref: ShallowRef<T>,
  next: T
) => {
  for (const key in next) {
    if (ref.value[key] !== next[key]) {
      ref.value = next;
      return;
    }
  }
};

import type { GraphQLRequest, AnyVariables } from '@urql/core';
import type { Ref, ShallowRef } from 'vue';
import { isRef } from 'vue';

export function unwrapPossibleProxy<V>(possibleProxy: V | Ref<V>): V {
  return possibleProxy && isRef(possibleProxy)
    ? possibleProxy.value
    : possibleProxy;
}

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

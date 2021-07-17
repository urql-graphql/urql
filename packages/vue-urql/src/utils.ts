import { Ref, isRef } from 'vue';

export function unwrapPossibleProxy<V>(
  possibleProxy: V | Ref<V> | undefined
): V | undefined {
  return possibleProxy && isRef(possibleProxy)
    ? possibleProxy.value
    : possibleProxy;
}

import { Ref, isRef } from 'vue';

export function unwrapPossibleProxy<V>(possibleProxy: V | Ref<V>): V {
  return possibleProxy && isRef(possibleProxy)
    ? possibleProxy.value
    : possibleProxy;
}

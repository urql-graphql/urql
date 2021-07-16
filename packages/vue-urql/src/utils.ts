import { Ref } from 'vue';

export function unwrapPossibleProxy<V>(
  possibleProxy: V | Ref<V> | undefined
): V {
  return possibleProxy && typeof possibleProxy === 'object'
    ? JSON.parse(JSON.stringify(possibleProxy))
    : possibleProxy;
}

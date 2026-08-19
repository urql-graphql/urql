import type { FragmentDefinitionNode } from '@0no-co/graphql.web';
import type { Client } from '@urql/core';

export { getDeferredCacheForClient } from '@urql/core';

/** A pending suspense {@link Promise} that the `useFragment` hook throws.
 *
 * @internal
 */
export type FragmentPromise = Promise<unknown> & {
  _resolve: () => void;
};

type FragmentCache = WeakMap<
  FragmentDefinitionNode,
  WeakMap<object, FragmentPromise>
>;

interface ClientWithCache extends Client {
  _fragments?: FragmentCache;
}

/** Returns a pending fragment promise for this exact fragment and data object.
 *
 * @remarks
 * Weak keys keep sibling objects and named fragments independent and allow
 * abandoned suspended renders to be garbage-collected without an effect.
 *
 * @internal
 */
export const getFragmentPromise = (
  client: Client,
  fragment: FragmentDefinitionNode,
  data: object
): FragmentPromise | undefined => {
  const cache = (client as ClientWithCache)._fragments;
  const entries = cache && cache.get(fragment);
  return entries && entries.get(data);
};

/** Stores a pending promise for this exact fragment and data object.
 *
 * @internal
 */
export const setFragmentPromise = (
  client: Client,
  fragment: FragmentDefinitionNode,
  data: object,
  promise: FragmentPromise
): void => {
  const target = client as ClientWithCache;
  const cache = target._fragments || (target._fragments = new WeakMap());
  let entries = cache.get(fragment);
  if (!entries) cache.set(fragment, (entries = new WeakMap()));
  entries.set(data, promise);
};

/** Deletes a settled fragment promise.
 *
 * @internal
 */
export const deleteFragmentPromise = (
  client: Client,
  fragment: FragmentDefinitionNode,
  data: object
): void => {
  const cache = (client as ClientWithCache)._fragments;
  const entries = cache && cache.get(fragment);
  if (entries) entries.delete(data);
};

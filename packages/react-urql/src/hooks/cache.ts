import { pipe, subscribe } from 'wonka';
import type { FragmentDefinitionNode } from '@0no-co/graphql.web';
import type { Client, OperationResult } from '@urql/core';

type CacheEntry = OperationResult | Promise<unknown> | undefined;

interface Cache {
  get(key: number): CacheEntry;
  set(key: number, value: CacheEntry): void;
  clear(key: number): void;
  dispose(key: number): void;
}

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
  _react?: Cache;
}

export const getCacheForClient = (client: Client): Cache => {
  if (!(client as ClientWithCache)._react) {
    const reclaim = new Set();
    const map = new Map<number, CacheEntry>();

    if (client.operations$ /* not available in mocks */) {
      pipe(
        client.operations$,
        subscribe(operation => {
          if (operation.kind === 'teardown' && reclaim.has(operation.key)) {
            reclaim.delete(operation.key);
            map.delete(operation.key);
          }
        })
      );
    }

    (client as ClientWithCache)._react = {
      get(key) {
        return map.get(key);
      },
      set(key, value) {
        reclaim.delete(key);
        map.set(key, value);
      },
      clear(key) {
        reclaim.delete(key);
        map.delete(key);
      },
      dispose(key) {
        reclaim.add(key);
      },
    };
  }

  return (client as ClientWithCache)._react!;
};

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

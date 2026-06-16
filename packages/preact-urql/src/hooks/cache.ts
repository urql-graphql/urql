import type { Client, Cache } from '@urql/core';
import { makeCache } from '@urql/core';

export { getDeferredCacheForClient } from '@urql/core';

/** A pending suspense {@link Promise} that the `useFragment` hook throws.
 *
 * @remarks
 * `_resolve` is called once the masked fragment’s data is fully present,
 * which tells Preact to retry rendering the suspended boundary.
 *
 * @internal
 */
export type FragmentPromise = Promise<unknown> & {
  _resolve: () => void;
};

type FragmentCacheEntry = FragmentPromise | undefined;

interface ClientWithCache extends Client {
  _fragments?: Cache<FragmentCacheEntry>;
}

/** Cache of pending `useFragment` suspense promises, keyed by an entity-aware key.
 *
 * @remarks
 * Stores the {@link FragmentPromise} a `useFragment` hook throws while its
 * deferred data is still streaming in, kept separately so that multiple
 * `useFragment` hooks rendering different entities (e.g. siblings in a list)
 * don’t share — and prematurely resolve — each other’s promises.
 *
 * @internal
 */
export const getFragmentCacheForClient = (
  client: Client
): Cache<FragmentCacheEntry> => {
  if (!(client as ClientWithCache)._fragments) {
    (client as ClientWithCache)._fragments = makeCache<FragmentCacheEntry>();
  }

  return (client as ClientWithCache)._fragments!;
};

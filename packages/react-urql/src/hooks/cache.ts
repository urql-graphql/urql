import { pipe, subscribe } from 'wonka';
import type { Client, OperationResult } from '@urql/core';
import type { DeferredState } from './defer';
import { resolveDeferredState } from './defer';

/** A pending suspense {@link Promise} that the `useFragment` hook throws.
 *
 * @remarks
 * `_resolve` is called once the masked fragment’s data is fully present,
 * which tells React to retry rendering the suspended boundary.
 *
 * @internal
 */
export type FragmentPromise = Promise<unknown> & {
  _resolve: () => void;
};

type CacheEntry = OperationResult | Promise<unknown> | undefined;

type FragmentCacheEntry = FragmentPromise | undefined;
type DeferredCacheEntry = DeferredState | undefined;

interface Cache<Entry> {
  get(key: number): Entry | undefined;
  set(key: number, value: Entry): void;
  clear(key: number): void;
  dispose(key: number): void;
}

interface ClientWithCache extends Client {
  _deferred?: Cache<DeferredCacheEntry>;
  _fragments?: Cache<FragmentCacheEntry>;
  _react?: Cache<CacheEntry>;
}

const makeCache = <Entry>(
  client?: Client,
  onClear?: (value: Entry) => void,
  deferDispose?: boolean
): Cache<Entry> => {
  const operations$ = client && (client as Partial<Client>).operations$;
  const reclaim = new Set<number>();
  const map = new Map<number, Entry>();

  const clear = (key: number) => {
    const value = map.get(key);
    if (value !== undefined && onClear) onClear(value);
    reclaim.delete(key);
    map.delete(key);
  };

  if (operations$ /* not available in mocks */) {
    pipe(
      operations$,
      subscribe(operation => {
        if (operation.kind === 'teardown' && reclaim.has(operation.key)) {
          clear(operation.key);
        }
      })
    );
  }

  return {
    get(key) {
      return map.get(key);
    },
    set(key, value) {
      reclaim.delete(key);
      map.set(key, value);
    },
    clear,
    dispose(key) {
      if (operations$ || deferDispose) {
        reclaim.add(key);
      } else {
        clear(key);
      }
    },
  };
};

export const getCacheForClient = (client: Client): Cache<CacheEntry> => {
  if (!(client as ClientWithCache)._react) {
    (client as ClientWithCache)._react = makeCache<CacheEntry>(
      client,
      undefined,
      true
    );
  }

  return (client as ClientWithCache)._react!;
};

/** Cache of pending `useFragment` suspense promises, keyed by an entity-aware key.
 *
 * @remarks
 * Unlike {@link getCacheForClient}, this cache stores the {@link FragmentPromise}
 * a `useFragment` hook throws while its deferred data is still streaming in. It’s
 * kept separately so that multiple `useFragment` hooks rendering different entities
 * (e.g. siblings in a list) don’t share — and prematurely resolve — each other’s
 * promises.
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

/** Cache of per-operation deferred promises that are resolved by `useQuery`.
 *
 * @remarks
 * These promises are embedded into streamed query results so `useFragment`
 * can throw the same stable promise that the query stream resolves directly
 * when the matching deferred patch arrives.
 *
 * @internal
 */
export const getDeferredCacheForClient = (
  client: Client
): Cache<DeferredCacheEntry> => {
  if (!(client as ClientWithCache)._deferred) {
    (client as ClientWithCache)._deferred = makeCache<DeferredCacheEntry>(
      client,
      state => {
        if (state) resolveDeferredState(state);
      }
    );
  }

  return (client as ClientWithCache)._deferred!;
};

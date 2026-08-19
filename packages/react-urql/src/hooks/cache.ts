import type { Client, OperationResult, Cache } from '@urql/core';
import { makeCache } from '@urql/core';

export { getDeferredCacheForClient } from '@urql/core';

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

/** An entity-aware cache of pending fragment suspense promises.
 *
 * @internal
 */
export interface FragmentCache {
  get(
    key: number,
    fragmentName: string,
    data: any
  ): FragmentPromise | undefined;
  set(
    key: number,
    fragmentName: string,
    data: any,
    value: FragmentPromise
  ): void;
  dispose(key: number, fragmentName: string, data: any): void;
}

interface ClientWithCache extends Client {
  _fragments?: FragmentCache;
  _react?: Cache<CacheEntry>;
}

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

const makeFragmentCache = (): FragmentCache => {
  const entities = new Map<string, FragmentPromise>();
  const objects = new WeakMap<object, Map<string, FragmentPromise>>();
  const primitives = new Map<string, FragmentPromise>();

  const getScope = (key: number, fragmentName: string) =>
    `${key}:${fragmentName}`;

  const getEntityKey = (
    key: number,
    fragmentName: string,
    data: any
  ): string | undefined => {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const id = data.id != null ? data.id : data._id;
      if (data.__typename != null && id != null) {
        return JSON.stringify([
          key,
          fragmentName,
          String(data.__typename),
          String(id),
        ]);
      }
    }
  };

  const getObjectCache = (
    data: object,
    create: boolean
  ): Map<string, FragmentPromise> | undefined => {
    let cache = objects.get(data);
    if (!cache && create) {
      cache = new Map();
      objects.set(data, cache);
    }
    return cache;
  };

  const getPrimitiveKey = (key: number, fragmentName: string, data: any) =>
    `${getScope(key, fragmentName)}:${typeof data}:${String(data)}`;

  return {
    get(key, fragmentName, data) {
      const entityKey = getEntityKey(key, fragmentName, data);
      if (entityKey) return entities.get(entityKey);
      if (data && typeof data === 'object') {
        const cache = getObjectCache(data, false);
        return cache && cache.get(getScope(key, fragmentName));
      }
      return primitives.get(getPrimitiveKey(key, fragmentName, data));
    },
    set(key, fragmentName, data, value) {
      const entityKey = getEntityKey(key, fragmentName, data);
      if (entityKey) {
        entities.set(entityKey, value);
      } else if (data && typeof data === 'object') {
        getObjectCache(data, true)!.set(getScope(key, fragmentName), value);
      } else {
        primitives.set(getPrimitiveKey(key, fragmentName, data), value);
      }
    },
    dispose(key, fragmentName, data) {
      const entityKey = getEntityKey(key, fragmentName, data);
      if (entityKey) {
        entities.delete(entityKey);
      } else if (data && typeof data === 'object') {
        const cache = getObjectCache(data, false);
        if (cache) cache.delete(getScope(key, fragmentName));
      } else {
        primitives.delete(getPrimitiveKey(key, fragmentName, data));
      }
    },
  };
};

/** Cache of pending `useFragment` suspense promises, scoped by fragment and entity.
 *
 * @remarks
 * Identifiable entities use `__typename` and `id`/`_id`. Other objects are
 * tracked by reference in a {@link WeakMap}, preventing unrelated siblings from
 * sharing promises and allowing abandoned entries to be garbage-collected.
 *
 * @internal
 */
export const getFragmentCacheForClient = (client: Client): FragmentCache => {
  if (!(client as ClientWithCache)._fragments) {
    (client as ClientWithCache)._fragments = makeFragmentCache();
  }

  return (client as ClientWithCache)._fragments!;
};

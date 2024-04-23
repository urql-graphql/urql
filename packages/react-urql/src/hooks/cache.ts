import { pipe, subscribe } from 'wonka';
import type { Client, OperationResult } from '@urql/core';

export type FragmentPromise = Promise<unknown> & {
  _resolve: () => void;
  _resolved: boolean;
};

type CacheEntry = OperationResult | Promise<unknown> | undefined;

type FragmentCacheEntry = Promise<unknown> | undefined;

interface Cache<Entry> {
  get(key: number): Entry;
  set(key: number, value: Entry): void;
  dispose(key: number): void;
}

interface ClientWithCache extends Client {
  _fragments?: Cache<FragmentCacheEntry>;
  _react?: Cache<CacheEntry>;
}

export const getCacheForClient = (client: Client): Cache<CacheEntry> => {
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
        map.set(key, value);
      },
      dispose(key) {
        reclaim.add(key);
      },
    };
  }

  return (client as ClientWithCache)._react!;
};

export const getFragmentCacheForClient = (
  client: Client
): Cache<FragmentCacheEntry> => {
  if (!(client as ClientWithCache)._fragments) {
    const map = new Map<number, FragmentCacheEntry>();

    (client as ClientWithCache)._fragments = {
      get(key) {
        return map.get(key);
      },
      set(key, value) {
        map.set(key, value);
      },
      dispose(key) {
        map.delete(key);
      },
    };
  }

  return (client as ClientWithCache)._fragments!;
};

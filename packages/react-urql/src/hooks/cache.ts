import { pipe, subscribe } from 'wonka';
import type { Client, OperationResult } from '@urql/core';

export type FragmentPromise = Promise<unknown> & {
  _resolve: () => void;
  _resolved: boolean;
};
type CacheEntry =
  | OperationResult
  | Promise<unknown>
  | FragmentPromise
  | undefined;

interface Cache {
  get(key: number): CacheEntry;
  set(key: number, value: CacheEntry): void;
  dispose(key: number): void;
}

interface ClientWithCache extends Client {
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
      dispose(key) {
        reclaim.add(key);
      },
    };
  }

  return (client as ClientWithCache)._react!;
};

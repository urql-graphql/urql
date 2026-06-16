import { pipe, subscribe } from 'wonka';
import type { Client } from '../client';
import type { DeferredState } from './defer';
import { resolveDeferredState } from './defer';

/** A small per-operation cache attached to a {@link Client}, keyed by an
 * operation/request `key`. (BETA)
 *
 * @remarks
 * Entries can be `dispose`d, which marks them for reclamation once the matching
 * operation is torn down (when the cache is bound to a `Client`’s
 * `operations$`), rather than being removed immediately.
 *
 * @beta
 */
export interface Cache<Entry> {
  get(key: number): Entry | undefined;
  set(key: number, value: Entry): void;
  clear(key: number): void;
  dispose(key: number): void;
}

/** Creates a {@link Cache} that optionally reclaims entries on operation teardown. (BETA)
 *
 * @param client - the {@link Client} whose `operations$` drives teardown-based reclamation.
 * @param onClear - an optional callback invoked with an entry when it’s cleared.
 * @param deferDispose - when `true`, `dispose` marks for reclamation even without a `client`.
 *
 * @remarks
 * When a `client` is passed, this subscribes to its `operations$` stream — and
 * only then; importing this module has no side effects. Disposed entries are
 * removed when their operation’s `teardown` is observed; otherwise `dispose`
 * clears immediately.
 *
 * @beta
 */
export const makeCache = <Entry>(
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

type DeferredCacheEntry = DeferredState | undefined;

interface ClientWithDeferredCache extends Client {
  _deferred?: Cache<DeferredCacheEntry>;
}

/** Returns the per-{@link Client} cache of {@link DeferredState}, creating it lazily. (BETA)
 *
 * @remarks
 * Bindings store one {@link DeferredState} per operation here (keyed by
 * `request.key`) so that the {@link DeferredPromise}s installed by
 * {@link updateDeferredResult} are shared between the query stream and any
 * consumer suspending on a `@defer`-red boundary. Entries are reclaimed on
 * teardown, resolving any still-pending promises so no boundary stays suspended.
 *
 * @beta
 */
export const getDeferredCacheForClient = (
  client: Client
): Cache<DeferredCacheEntry> => {
  if (!(client as ClientWithDeferredCache)._deferred) {
    (client as ClientWithDeferredCache)._deferred =
      makeCache<DeferredCacheEntry>(client, state => {
        if (state) resolveDeferredState(state);
      });
  }

  return (client as ClientWithDeferredCache)._deferred!;
};

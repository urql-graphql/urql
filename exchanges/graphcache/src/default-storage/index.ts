import type {
  SerializedEntries,
  SerializedRequest,
  StorageAdapter,
} from '../types';

const getRequestPromise = <T>(request: IDBRequest<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
};

const getTransactionPromise = (transaction: IDBTransaction): Promise<any> => {
  return new Promise((resolve, reject) => {
    transaction.onerror = () => {
      reject(transaction.error);
    };

    transaction.oncomplete = resolve;
  });
};

export interface StorageOptions {
  /** Name of the IndexedDB database that will be used.
   * @defaultValue `'graphcache-v4'`
   */
  idbName?: string;
  /** Maximum age of cache entries (in days) after which data is discarded.
   * @defaultValue `7` days
   */
  maxAge?: number;
  /** Gets Called when the exchange has hydrated the data from storage. */
  onCacheHydrated?: () => void;
}

/** Sample storage adapter persisting to IndexedDB. */
export interface DefaultStorage extends StorageAdapter {
  /** Clears the entire IndexedDB storage. */
  clear(): Promise<any>;
}

/** Creates a default {@link StorageAdapter} which uses IndexedDB for storage.
 *
 * @param opts - A {@link StorageOptions} configuration object.
 * @returns the created {@link StorageAdapter}.
 *
 * @remarks
 * The default storage uses IndexedDB to persist the normalized cache for
 * offline use. It demonstrates that the cache can be chunked by timestamps.
 *
 * Note: We have no data on stability of this storage and our Offline Support
 * for large APIs or longterm use. Proceed with caution.
 */
export const makeDefaultStorage = (opts?: StorageOptions): DefaultStorage => {
  if (!opts) opts = {};

  let callback: (() => void) | undefined;

  const DB_NAME = opts.idbName || 'graphcache-v4';
  const ENTRIES_STORE_NAME = 'entries';
  const METADATA_STORE_NAME = 'metadata';

  let batch: Record<string, string | undefined> = Object.create(null);
  const timestamp = Math.floor(new Date().valueOf() / (1000 * 60 * 60 * 24));
  const maxAge = timestamp - (opts.maxAge || 7);

  const req = indexedDB.open(DB_NAME, 1);
  const database$ = getRequestPromise(req);

  req.onupgradeneeded = () => {
    req.result.createObjectStore(ENTRIES_STORE_NAME);
    req.result.createObjectStore(METADATA_STORE_NAME);
  };

  return {
    clear() {
      return database$.then(database => {
        const transaction = database.transaction(
          [METADATA_STORE_NAME, ENTRIES_STORE_NAME],
          'readwrite'
        );
        transaction.objectStore(METADATA_STORE_NAME).clear();
        transaction.objectStore(ENTRIES_STORE_NAME).clear();
        batch = Object.create(null);
        return getTransactionPromise(transaction);
      });
    },

    readMetadata(): Promise<null | SerializedRequest[]> {
      return database$.then(
        database => {
          return getRequestPromise<SerializedRequest[]>(
            database
              .transaction(METADATA_STORE_NAME, 'readonly')
              .objectStore(METADATA_STORE_NAME)
              .get(METADATA_STORE_NAME)
          );
        },
        () => null
      );
    },

    writeMetadata(metadata: SerializedRequest[]) {
      database$.then(
        database => {
          return getRequestPromise(
            database
              .transaction(METADATA_STORE_NAME, 'readwrite')
              .objectStore(METADATA_STORE_NAME)
              .put(metadata, METADATA_STORE_NAME)
          );
        },
        () => {
          /* noop */
        }
      );
    },

    writeData(entries: SerializedEntries): Promise<void> {
      Object.assign(batch, entries);
      const toUndefined = () => undefined;

      return database$
        .then(database => {
          return getRequestPromise(
            database
              .transaction(ENTRIES_STORE_NAME, 'readwrite')
              .objectStore(ENTRIES_STORE_NAME)
              .put(batch, timestamp)
          );
        })
        .then(toUndefined, toUndefined);
    },

    readData(): Promise<SerializedEntries> {
      return database$
        .then(database => {
          const transaction = database.transaction(
            ENTRIES_STORE_NAME,
            'readwrite'
          );

          const store = transaction.objectStore(ENTRIES_STORE_NAME);
          const request = (store.openKeyCursor || store.openCursor).call(store);

          request.onsuccess = function () {
            if (this.result) {
              const { key } = this.result;
              if (typeof key !== 'number' || key < maxAge) {
                store.delete(key);
              } else {
                const request = store.get(key);
                request.onsuccess = () => {
                  if (key === timestamp)
                    Object.assign(batch, request.result);
                };
              }

              this.result.continue();
            }
          };

          return getTransactionPromise(transaction);
        })
        .then(
          () => batch,
          () => batch
        );
    },
    onCacheHydrated: opts.onCacheHydrated,
    onOnline(cb: () => void) {
      if (callback) {
        window.removeEventListener('online', callback);
        callback = undefined;
      }

      window.addEventListener(
        'online',
        (callback = () => {
          cb();
        })
      );
    },
  };
};

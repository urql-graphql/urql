import { stringifyVariables } from '@urql/core';
import { SerializedEntries, SerializedRequest, StorageAdapter } from '../types';

const getRequestPromise = <T>(
  request: IDBRequest<T> | IDBTransaction
): Promise<T> => {
  return new Promise((resolve, reject) => {
    request.onerror = () => {
      reject(request.error);
    };

    (request as IDBRequest<
      T
    >).onsuccess = (request as IDBTransaction).oncomplete = () => {
      resolve((request as IDBRequest<T>).result);
    };
  });
};

export interface StorageOptions {
  idbName?: string;
  maxAge?: number;
}

export interface DefaultStorage extends StorageAdapter {
  clear(): Promise<any>;
}

export const makeDefaultStorage = (opts?: StorageOptions): DefaultStorage => {
  if (!opts) opts = {};

  const DB_NAME = opts.idbName || 'graphcache-v3';
  const ENTRIES_STORE_NAME = 'entries';
  const METADATA_STORE_NAME = 'metadata';

  const batch: Record<string, string | undefined> = Object.create(null);
  const timestamp = Math.floor(new Date().valueOf() / (1000 * 60 * 60 * 24));
  const maxAge = timestamp - (opts.maxAge || 7);

  const req = indexedDB.open(DB_NAME, 1);
  const database$ = getRequestPromise(req);

  req.onupgradeneeded = () => {
    req.result.createObjectStore(ENTRIES_STORE_NAME);
    req.result.createObjectStore(METADATA_STORE_NAME);
  };

  const serializeBatch = (): string => {
    let data = '';
    for (const key in batch) {
      const value = batch[key];
      data += `${stringifyVariables(key)}:${
        value !== undefined ? stringifyVariables(value) : 'null'
      },`;
    }

    return data;
  };

  const deserializeBatch = (input: string) => {
    try {
      return JSON.parse(`{${input.slice(0, -1)}}`);
    } catch (_error) {
      return {};
    }
  };

  return {
    clear() {
      return database$.then(database => {
        const transaction = database.transaction(
          METADATA_STORE_NAME,
          'readwrite'
        );
        transaction.objectStore(METADATA_STORE_NAME).clear();
        transaction.objectStore(ENTRIES_STORE_NAME).clear();
        return getRequestPromise(transaction);
      });
    },

    readMetadata(): Promise<SerializedRequest[]> {
      return database$.then(
        database => {
          return getRequestPromise<SerializedRequest[]>(
            database
              .transaction(METADATA_STORE_NAME, 'readonly')
              .objectStore(METADATA_STORE_NAME)
              .get(METADATA_STORE_NAME)
          );
        },
        () => []
      );
    },

    writeMetadata(metadata: SerializedRequest[]) {
      database$.then(
        database => {
          database
            .transaction(METADATA_STORE_NAME, 'readonly')
            .objectStore(METADATA_STORE_NAME)
            .put(metadata, METADATA_STORE_NAME);
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
              .put(serializeBatch(), timestamp)
          );
        })
        .then(toUndefined, toUndefined);
    },

    readData(): Promise<SerializedEntries> {
      const chunks: string[] = [];
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
                const index = chunks.length;
                chunks.push('');
                request.onsuccess = () => {
                  const result = '' + request.result;
                  if (key === timestamp)
                    Object.assign(batch, deserializeBatch(result));
                  chunks[index] = result;
                };
              }

              this.result.continue();
            }
          };

          return getRequestPromise(transaction);
        })
        .then(
          () => deserializeBatch(chunks.join('')),
          () => batch
        );
    },

    onOnline(cb: () => void) {
      window.addEventListener('online', () => {
        cb();
      });
    },
  };
};

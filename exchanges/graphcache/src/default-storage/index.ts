import { SerializedEntries, SerializedRequest, StorageAdapter } from '../types';

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
  idbName?: string;
  maxAge?: number;
}

export interface DefaultStorage extends StorageAdapter {
  clear(): Promise<any>;
}

export const makeDefaultStorage = (opts?: StorageOptions): DefaultStorage => {
  if (!opts) opts = {};

  let callback: (() => void) | undefined;

  const DB_NAME = opts.idbName || 'graphcache-v4';
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

  const serializeEntry = (entry: string): string => entry.replace(/:/g, '%3a');

  const deserializeEntry = (entry: string): string =>
    entry.replace(/%3a/g, ':');

  const serializeBatch = (): string => {
    let data = '';
    for (const key in batch) {
      const value = batch[key];
      data += serializeEntry(key);
      data += ':';
      if (value) data += serializeEntry(value);
      data += ':';
    }

    return data;
  };

  const deserializeBatch = (input: string) => {
    const data = {};
    let char = '',
      key = '',
      entry = '',
      mode = 0,
      index = 0;

    while (index < input.length) {
      entry = '';
      while ((char = input[index++]) !== ':' && char) {
        entry += char;
      }

      if (mode) {
        data[key] = deserializeEntry(entry) || undefined;
        mode = 0;
      } else {
        key = deserializeEntry(entry);
        mode = 1;
      }
    }

    return data;
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

          return getTransactionPromise(transaction);
        })
        .then(
          () => deserializeBatch(chunks.join('')),
          () => batch
        );
    },

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

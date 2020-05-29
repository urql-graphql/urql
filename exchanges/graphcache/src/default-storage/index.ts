import { SerializedEntries, SerializedRequest } from '../types';

const DB_NAME = 'graphcache-v3';
const ENTRIES_STORE_NAME = 'entries';
const METADATA_STORE_NAME = 'metadata';

const database$ = new Promise<IDBDatabase>((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, 1);

  req.onerror = () => {
    reject(req.error);
  };

  req.onsuccess = () => {
    resolve(req.result);
  };

  req.onupgradeneeded = () => {
    req.result.createObjectStore(ENTRIES_STORE_NAME);
    req.result.createObjectStore(METADATA_STORE_NAME);
  };
});

export const readMetadata = (): Promise<SerializedRequest[]> =>
  database$
    .then(
      (database): Promise<SerializedRequest[]> => {
        const transaction = database.transaction(
          METADATA_STORE_NAME,
          'readonly'
        );
        const store = transaction.objectStore(METADATA_STORE_NAME);
        const request = store.get(METADATA_STORE_NAME);

        return new Promise(resolve => {
          request.onsuccess = () => {
            resolve(request.result);
          };
        });
      }
    )
    .catch(() => []);

export const writeMetadata = (metadata: SerializedRequest[]) => {
  database$
    .then(database => {
      const transaction = database.transaction(METADATA_STORE_NAME, 'readonly');
      const store = transaction.objectStore(METADATA_STORE_NAME);
      store.put(metadata, METADATA_STORE_NAME);
    })
    .catch(() => {
      /* noop */
    });
};

const batch: Record<string, string | undefined> = Object.create(null);
const timestamp = Math.floor(new Date().valueOf() / (1000 * 60 * 60 * 24));
const maxAge = timestamp - 7;

const serializeBatch = (): string => {
  let data = '';
  for (const key in batch) data += `"${key}":${batch[key] || 'null'},`;
  return data;
};

const deserializeBatch = (input: string) => {
  return JSON.parse(`{${input.slice(0, -1)}}`);
};

export const writeData = (entries: SerializedEntries): Promise<void> => {
  Object.assign(batch, entries);
  return database$
    .then(
      (database): Promise<void> => {
        const transaction = database.transaction(
          ENTRIES_STORE_NAME,
          'readwrite'
        );
        const store = transaction.objectStore(ENTRIES_STORE_NAME);
        store.put(serializeBatch(), timestamp);

        return new Promise((resolve, reject) => {
          transaction.onabort = transaction.onerror = () => {
            reject(transaction.error);
          };

          transaction.oncomplete = () => {
            resolve();
          };
        });
      }
    )
    .catch(() => {
      /* noop */
    });
};

export const readData = (): Promise<SerializedEntries> => {
  return database$
    .then(database => {
      const transaction = database.transaction(ENTRIES_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(ENTRIES_STORE_NAME);
      const request = (store.openKeyCursor || store.openCursor).call(store);

      const chunks: string[] = [];
      request.onsuccess = function () {
        const key = this.result && this.result.key;
        if (typeof key === 'number' && key >= maxAge) {
          const request = store.get(key);
          const index = chunks.length;
          chunks.push('');

          request.onsuccess = () => {
            if (typeof request.result === 'string') {
              if (key === timestamp)
                Object.assign(batch, deserializeBatch(request.result));
              chunks[index] = request.result;
            }
          };
        } else if (key) {
          store.delete(key);
        }
      };

      return new Promise<SerializedEntries>((resolve, reject) => {
        transaction.onabort = transaction.onerror = () => {
          reject(transaction.error);
        };

        transaction.oncomplete = () => {
          resolve(deserializeBatch(chunks.join('')));
        };
      });
    })
    .catch(() => batch);
};

export const onOnline = (cb: () => void) => {
  window.addEventListener('online', () => {
    cb();
  });
};

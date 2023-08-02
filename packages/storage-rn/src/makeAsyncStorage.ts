import type { StorageAdapter } from '@urql/exchange-graphcache';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface StorageOptions {
  /** Name of the `AsyncStorage` key that’s used for persisted data.
   * @defaultValue `'graphcache-data'`
   */
  dataKey?: string;
  /** Name of the `AsyncStorage` key that’s used for persisted metadata.
   * @defaultValue `'graphcache-metadata'`
   */
  metadataKey?: string;
  /** Maximum age of cache entries (in days) after which data is discarded.
   * @defaultValue `7` days
   */
  maxAge?: number;
}

const parseData = (persistedData: any, fallback: any) => {
  try {
    if (persistedData) {
      return JSON.parse(persistedData);
    }
  } catch (_err) {}

  return fallback;
};

let disconnect;

/** React Native storage adapter persisting to `AsyncStorage`. */
export interface DefaultAsyncStorage extends StorageAdapter {
  /** Clears the entire `AsyncStorage`. */
  clear(): Promise<any>;
}

/** Creates a {@link StorageAdapter} which uses React Native’s `AsyncStorage`.
 *
 * @param opts - A {@link StorageOptions} configuration object.
 * @returns the created {@link DefaultAsyncStorage} adapter.
 *
 * @remarks
 * `makeAsyncStorage` creates a storage adapter for React Native,
 * which persisted to `AsyncStorage` via the `@react-native-async-storage/async-storage`
 * package.
 *
 * Note: We have no data on stability of this storage and our Offline Support
 * for large APIs or longterm use. Proceed with caution.
 */
export const makeAsyncStorage: (
  ops?: StorageOptions
) => DefaultAsyncStorage = ({
  dataKey = 'graphcache-data',
  metadataKey = 'graphcache-metadata',
  maxAge = 7,
} = {}) => {
  const todayDayStamp = Math.floor(
    new Date().valueOf() / (1000 * 60 * 60 * 24)
  );
  let allData = {};

  return {
    readData: async () => {
      if (!Object.keys(allData).length) {
        let persistedData: string | null = null;
        try {
          persistedData = await AsyncStorage.getItem(dataKey);
        } catch (_err) {}
        const parsed = parseData(persistedData, {});

        Object.assign(allData, parsed);
      }

      // clean up old data
      let syncNeeded = false;
      Object.keys(allData).forEach(dayStamp => {
        if (todayDayStamp - Number(dayStamp) > maxAge) {
          syncNeeded = true;
          delete allData[dayStamp];
        }
      });

      if (syncNeeded) {
        try {
          await AsyncStorage.setItem(dataKey, JSON.stringify(allData));
        } catch (_err) {}
      }

      return Object.assign(
        {},
        ...Object.keys(allData).map(key => allData[key])
      );
    },

    writeData: async delta => {
      if (!Object.keys(allData).length) {
        let persistedData: string | null = null;
        try {
          persistedData = await AsyncStorage.getItem(dataKey);
        } catch (_err) {}
        const parsed = parseData(persistedData, {});
        Object.assign(allData, parsed);
      }

      const deletedKeys = {};
      Object.keys(delta).forEach(key => {
        if (delta[key] === undefined) {
          deletedKeys[key] = undefined;
        }
      });

      for (const key in allData) {
        allData[key] = Object.assign(allData[key], deletedKeys);
      }

      allData[todayDayStamp] = Object.assign(
        allData[todayDayStamp] || {},
        delta
      );

      try {
        await AsyncStorage.setItem(dataKey, JSON.stringify(allData));
      } catch (_err) {}
    },

    writeMetadata: async data => {
      try {
        await AsyncStorage.setItem(metadataKey, JSON.stringify(data));
      } catch (_err) {}
    },

    readMetadata: async () => {
      let persistedData: string | null = null;
      try {
        persistedData = await AsyncStorage.getItem(metadataKey);
      } catch (_err) {}
      return parseData(persistedData, []);
    },

    onOnline: cb => {
      if (disconnect) {
        disconnect();
        disconnect = undefined;
      }

      disconnect = NetInfo.addEventListener(({ isConnected }) => {
        if (isConnected) {
          cb();
        }
      });
    },

    clear: async () => {
      try {
        allData = {};
        await AsyncStorage.removeItem(dataKey);
        await AsyncStorage.removeItem(metadataKey);
      } catch (_err) {}
    },
  };
};

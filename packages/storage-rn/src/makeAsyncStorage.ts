import { StorageAdapter } from '@urql/exchange-graphcache';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export type StorageOptions = {
  dataKey?: string;
  metadataKey?: string;
  maxAge?: number; // Number of days
};

const getFromStorage = async (key: string, fallback: any) => {
  try {
    const persistedData = await AsyncStorage.getItem(key);

    if (persistedData) {
      return JSON.parse(persistedData);
    }
  } catch (_err) {}

  return fallback;
};

const saveToStorage = async (key: string, data: object) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (_err) {}
};

let disconnect;

export interface DefaultAsyncStorage extends StorageAdapter {
  clear(): Promise<any>;
}

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
  const allData = {};

  return {
    readData: async () => {
      if (!Object.keys(allData).length) {
        const parsed = await getFromStorage(dataKey, {});
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
        await saveToStorage(dataKey, allData);
      }

      return allData[todayDayStamp] || {};
    },

    writeData: async delta => {
      if (!Object.keys(allData).length) {
        const parsed = await getFromStorage(dataKey, {});
        Object.assign(allData, parsed);
      }

      const today = allData[todayDayStamp] || {};
      Object.assign(allData, {
        [todayDayStamp]: Object.assign(today, delta),
      });

      await saveToStorage(dataKey, allData);
    },

    writeMetadata: async data => {
      await saveToStorage(metadataKey, data);
    },

    readMetadata: async () => {
      return await getFromStorage(metadataKey, []);
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
        await AsyncStorage.removeItem(dataKey);
        await AsyncStorage.removeItem(metadataKey);
      } catch (_err) {}
    },
  };
};

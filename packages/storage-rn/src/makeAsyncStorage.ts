import { StorageAdapter } from '@urql/exchange-graphcache';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export type StorageOptions = {
  dataKey?: string;
  metadataKey?: string;
  maxAge?: number; // Number of days
};

const parseData = (persistedData: any, fallback: any) => {
  try {
    if (persistedData) {
      return JSON.parse(persistedData);
    }
  } catch (_err) {}

  return fallback;
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

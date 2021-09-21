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

export const makeAsyncStorage: (ops?: StorageOptions) => StorageAdapter = ({
  dataKey = 'graphcache-data',
  metadataKey = 'graphcache-metadata',
  maxAge = 7,
} = {}) => {
  const todayDayStamp = Math.floor(
    new Date().valueOf() / (1000 * 60 * 60 * 24)
  );
  const allData = {};
  const todayBatch = {};
  const prefixCheck = new RegExp(`^${dataKey}_(\\d+)$`);

  return {
    /**
     * On initial read, pull storage keys and see which match our storage key pattern.
     * Any record that is expired should be removed from AsyncStorage.
     * The rest of the batches should be merged into a cache in chrono order.
     * Also hydrate todayBatch if we find it.
     */
    readData: async () => {
      const cache = {};

      try {
        const persistedDayStamps = (await AsyncStorage.getAllKeys())
          .reduce<number[]>((filtered, curr) => {
            const match = curr.match(prefixCheck);
            const ts = match ? match[1] : undefined;

            if (ts) {
              filtered.push(Number(ts));
            }
            return filtered;
          }, [])
          .sort();

        // eslint-disable-next-line es5/no-for-of
        for (const dayStamp of persistedDayStamps) {
          // Discard
          if (todayDayStamp - dayStamp > maxAge) {
            await AsyncStorage.removeItem(`${dataKey}_${dayStamp}`);
          }
          // Parse batch and merge in.
          else {
            try {
              const data = await AsyncStorage.getItem(`${dataKey}_${dayStamp}`);
              if (data) {
                const parsedData = JSON.parse(data);
                Object.assign(cache, parsedData);

                // We found today's batch, let's hydrate that while we're at it.
                if (dayStamp === todayDayStamp) {
                  Object.assign(todayBatch, parsedData);
                }
              }
            } catch (_err) {}
          }
        }
      } catch (_err) {}

      return cache;
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
  };
};

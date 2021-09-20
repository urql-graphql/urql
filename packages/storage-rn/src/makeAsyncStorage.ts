import { StorageAdapter } from '@urql/exchange-graphcache';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export type StorageOptions = {
  dataKey?: string;
  metadataKey?: string;
  maxAge?: number; // Number of days
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
      try {
        Object.assign(todayBatch, delta);
        await AsyncStorage.setItem(
          `${dataKey}_${todayDayStamp}`,
          JSON.stringify(todayBatch)
        );
      } catch (_err) {}
    },

    writeMetadata: async data => {
      try {
        await AsyncStorage.setItem(metadataKey, JSON.stringify(data));
      } catch (_err) {}
    },

    readMetadata: async () => {
      try {
        const persistedMetadata = await AsyncStorage.getItem(metadataKey);
        if (persistedMetadata) {
          return JSON.parse(persistedMetadata);
        }
      } catch (_err) {}

      return [];
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

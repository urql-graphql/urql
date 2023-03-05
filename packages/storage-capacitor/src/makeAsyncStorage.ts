import { StorageAdapter } from '@urql/exchange-graphcache';
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';

export interface StorageOptions {
  dataKey?: string;
  metadataKey?: string;
  maxAge?: number; // Number of days
}

const parseData = (persistedData: any, fallback: any) => {
  try {
    if (persistedData) return JSON.parse(persistedData);
  } catch (_err) {}

  return fallback;
};

let disconnect: any = null;

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
  let allData = {} as any;

  return {
    readData: async () => {
      if (!Object.keys(allData).length) {
        let persistedData: string | null = null;
        try {
          persistedData = (await Preferences.get({ key: dataKey })) as any;
        } catch (_err) {}
        const parsed = parseData(persistedData, {});

        Object.assign(allData, parsed);
      }

      // clean up old data
      let syncNeeded = false;
      Object.keys(allData).forEach((dayStamp: any) => {
        if (todayDayStamp - Number(dayStamp) > maxAge) {
          syncNeeded = true;
          delete allData[dayStamp];
        }
      });

      if (syncNeeded) {
        try {
          await Preferences.set({
            key: dataKey,
            value: JSON.stringify(allData),
          });
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
          persistedData = (await Preferences.get({ key: dataKey })) as any;
        } catch (_err) {}
        const parsed = parseData(persistedData, {});
        Object.assign(allData, parsed);
      }

      const deletedKeys = {} as any;
      Object.keys(delta).forEach(key => {
        if (delta[key] === undefined) deletedKeys[key] = undefined;
      });

      for (const key in allData)
        allData[key] = Object.assign(allData[key], deletedKeys);

      allData[todayDayStamp] = Object.assign(
        allData[todayDayStamp] || {},
        delta
      );

      try {
        await Preferences.set({ key: dataKey, value: JSON.stringify(allData) });
      } catch (_err) {}
    },

    writeMetadata: async data => {
      try {
        await Preferences.set({
          key: metadataKey,
          value: JSON.stringify(data),
        });
      } catch (_err) {}
    },

    readMetadata: async () => {
      let persistedData: string | null = null;
      try {
        persistedData = (await Preferences.get({ key: metadataKey })) as any;
      } catch (_err) {}
      return parseData(persistedData, []);
    },

    onOnline: cb => {
      if (disconnect) {
        disconnect();
        disconnect = undefined;
      }
      disconnect = Network.addListener('networkStatusChange', status => {
        if (status.connected) cb();
      });
    },

    clear: async () => {
      try {
        allData = {};
        await Preferences.remove({ key: dataKey });
        await Preferences.remove({ key: metadataKey });
      } catch (_err) {}
    },
  };
};

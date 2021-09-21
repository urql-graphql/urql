import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { makeAsyncStorage } from './makeAsyncStorage';

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: () => 'addEventListener',
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: () => 'setItem',
  getItem: () => 'getItem',
  getAllKeys: () => 'getAllKeys',
  removeItem: () => 'removeItem',
}));

const request = [
  {
    query: 'something something',
    variables: { foo: 'bar' },
  },
];

const serializedRequest =
  '[{"query":"something something","variables":{"foo":"bar"}}]';

const entires = {
  hello: 'world',
};
const serializedEntries = '{"hello":"world"}';

describe('makeAsyncStorage', () => {
  describe('writeMetadata', () => {
    it('writes metadata to async storage', async () => {
      const setItemSpy = jest.fn();
      jest.spyOn(AsyncStorage, 'setItem').mockImplementationOnce(setItemSpy);

      const storage = makeAsyncStorage();

      if (storage && storage.writeMetadata) {
        await storage.writeMetadata(request);
      }

      expect(setItemSpy).toHaveBeenCalledWith(
        'graphcache-metadata',
        serializedRequest
      );
    });

    it('writes metadata using a custom key', async () => {
      const setItemSpy = jest.fn();
      jest.spyOn(AsyncStorage, 'setItem').mockImplementationOnce(setItemSpy);

      const storage = makeAsyncStorage({ metadataKey: 'my-custom-key' });

      if (storage && storage.writeMetadata) {
        await storage.writeMetadata(request);
      }

      expect(setItemSpy).toHaveBeenCalledWith(
        'my-custom-key',
        serializedRequest
      );
    });
  });

  describe('readMetadata', () => {
    it('returns an empty array if no metadata is found', async () => {
      const getItemSpy = jest.fn().mockResolvedValue(null);
      jest.spyOn(AsyncStorage, 'getItem').mockImplementationOnce(getItemSpy);

      const storage = makeAsyncStorage();

      if (storage && storage.readMetadata) {
        const result = await storage.readMetadata();
        expect(getItemSpy).toHaveBeenCalledWith('graphcache-metadata');
        expect(result).toEqual([]);
      }
    });

    it('returns the parsed JSON correctly', async () => {
      const getItemSpy = jest.fn().mockResolvedValue(serializedRequest);
      jest.spyOn(AsyncStorage, 'getItem').mockImplementationOnce(getItemSpy);

      const storage = makeAsyncStorage();

      if (storage && storage.readMetadata) {
        const result = await storage.readMetadata();
        expect(getItemSpy).toHaveBeenCalledWith('graphcache-metadata');
        expect(result).toEqual(request);
      }
    });

    it('reads metadata using a custom key', async () => {
      const getItemSpy = jest.fn().mockResolvedValue(serializedRequest);
      jest.spyOn(AsyncStorage, 'getItem').mockImplementationOnce(getItemSpy);

      const storage = makeAsyncStorage({ metadataKey: 'my-custom-key' });

      if (storage && storage.readMetadata) {
        const result = await storage.readMetadata();
        expect(getItemSpy).toHaveBeenCalledWith('my-custom-key');
        expect(result).toEqual(request);
      }
    });

    it('returns an empty array if json.parse errors', async () => {
      const getItemSpy = jest.fn().mockResolvedValue('surprise!');
      jest.spyOn(AsyncStorage, 'getItem').mockImplementationOnce(getItemSpy);
      const storage = makeAsyncStorage();

      if (storage && storage.readMetadata) {
        const result = await storage.readMetadata();
        expect(getItemSpy).toHaveBeenCalledWith('graphcache-metadata');
        expect(result).toEqual([]);
      }
    });
  });

  describe('writeData', () => {
    it('writes data to async storage', async () => {
      jest.spyOn(Date.prototype, 'valueOf').mockReturnValueOnce(1632209690641);
      const dayStamp = 18891;

      const setItemSpy = jest.fn();
      jest.spyOn(AsyncStorage, 'setItem').mockImplementationOnce(setItemSpy);

      const storage = makeAsyncStorage();

      if (storage && storage.writeData) {
        await storage.writeData(entires);
      }

      expect(setItemSpy).toHaveBeenCalledWith(
        'graphcache-data',
        `{"${dayStamp}":${serializedEntries}}`
      );
    });

    it('writes data to async storage using custom key', async () => {
      jest.spyOn(Date.prototype, 'valueOf').mockReturnValueOnce(1632209690641);
      const dayStamp = 18891;

      const setItemSpy = jest.fn();
      jest.spyOn(AsyncStorage, 'setItem').mockImplementationOnce(setItemSpy);

      const storage = makeAsyncStorage({ dataKey: 'my-custom-key' });

      if (storage && storage.writeData) {
        await storage.writeData(entires);
      }

      expect(setItemSpy).toHaveBeenCalledWith(
        'my-custom-key',
        `{"${dayStamp}":${serializedEntries}}`
      );
    });

    it('merges previous writes', async () => {
      jest.spyOn(Date.prototype, 'valueOf').mockReturnValueOnce(1632209690641);
      const dayStamp = 18891;

      const setItemSpy = jest.fn();
      jest.spyOn(AsyncStorage, 'setItem').mockImplementationOnce(setItemSpy);

      const storage = makeAsyncStorage();

      // write once
      if (storage && storage.writeData) {
        await storage.writeData(entires);
      }

      expect(setItemSpy).toHaveBeenCalledWith(
        'graphcache-data',
        `{"${dayStamp}":${serializedEntries}}`
      );

      // write twice
      const secondSetItemSpy = jest.fn();
      jest
        .spyOn(AsyncStorage, 'setItem')
        .mockImplementationOnce(secondSetItemSpy);

      if (storage && storage.writeData) {
        storage.writeData({ foo: 'bar' });
      }
      expect(secondSetItemSpy).toHaveBeenCalledWith(
        'graphcache-data',
        `{"${dayStamp}":${JSON.stringify({ hello: 'world', foo: 'bar' })}}`
      );
    });

    it('keeps items from previous days', async () => {
      jest.spyOn(Date.prototype, 'valueOf').mockReturnValueOnce(1632209690641);
      const dayStamp = 18891;
      const oldDayStamp = 18857;
      jest
        .spyOn(AsyncStorage, 'getItem')
        .mockResolvedValueOnce(
          JSON.stringify({ [oldDayStamp]: { foo: 'bar' } })
        );

      const setItemSpy = jest.fn();
      jest.spyOn(AsyncStorage, 'setItem').mockImplementationOnce(setItemSpy);

      const storage = makeAsyncStorage();

      if (storage && storage.writeData) {
        await storage.writeData(entires);
      }

      expect(setItemSpy).toHaveBeenCalledWith(
        'graphcache-data',
        JSON.stringify({ [oldDayStamp]: { foo: 'bar' }, [dayStamp]: entires })
      );
    });
  });

  describe('readData', () => {
    it('returns an empty object if no data is found', async () => {
      const getItemSpy = jest.fn().mockResolvedValue(null);
      jest.spyOn(AsyncStorage, 'getItem').mockImplementationOnce(getItemSpy);

      const storage = makeAsyncStorage();

      if (storage && storage.readData) {
        const result = await storage.readData();
        expect(getItemSpy).toHaveBeenCalledWith('graphcache-data');
        expect(result).toEqual({});
      }
    });

    it("returns today's data correctly", async () => {
      jest.spyOn(Date.prototype, 'valueOf').mockReturnValueOnce(1632209690641);
      const dayStamp = 18891;
      const mockData = JSON.stringify({ [dayStamp]: entires });
      const getItemSpy = jest.fn().mockResolvedValue(mockData);
      jest.spyOn(AsyncStorage, 'getItem').mockImplementationOnce(getItemSpy);

      const storage = makeAsyncStorage();

      if (storage && storage.readData) {
        const result = await storage.readData();
        expect(getItemSpy).toHaveBeenCalledWith('graphcache-data');
        expect(result).toEqual(entires);
      }
    });

    it('merges data from past days correctly', async () => {
      jest.spyOn(Date.prototype, 'valueOf').mockReturnValueOnce(1632209690641);
      const dayStamp = 18891;
      const mockData = JSON.stringify({
        [dayStamp]: { one: 'one' },
        [dayStamp - 1]: { two: 'two' },
        [dayStamp - 3]: { three: 'three' },
        [dayStamp - 4]: { two: 'old' },
      });
      const getItemSpy = jest.fn().mockResolvedValue(mockData);
      jest.spyOn(AsyncStorage, 'getItem').mockImplementationOnce(getItemSpy);

      const storage = makeAsyncStorage();

      if (storage && storage.readData) {
        const result = await storage.readData();
        expect(getItemSpy).toHaveBeenCalledWith('graphcache-data');
        expect(result).toEqual({
          one: 'one',
          two: 'two',
          three: 'three',
        });
      }
    });

    it('cleans up old data', async () => {
      jest.spyOn(Date.prototype, 'valueOf').mockReturnValueOnce(1632209690641);
      const dayStamp = 18891;
      const maxAge = 5;
      const mockData = JSON.stringify({
        [dayStamp]: entires, // should be kept
        [dayStamp - maxAge + 1]: entires, // should be kept
        [dayStamp - maxAge - 1]: { old: 'data' }, // should get deleted
      });
      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValueOnce(mockData);
      const setItemSpy = jest.fn();
      jest.spyOn(AsyncStorage, 'setItem').mockImplementationOnce(setItemSpy);

      const storage = makeAsyncStorage({ maxAge });

      if (storage && storage.readData) {
        const result = await storage.readData();
        expect(result).toEqual(entires);
        expect(setItemSpy).toBeCalledWith(
          'graphcache-data',
          JSON.stringify({
            [dayStamp]: entires,
            [dayStamp - maxAge + 1]: entires,
          })
        );
      }
    });
  });

  describe('onOnline', () => {
    it('sets up an event listener for the network change event', () => {
      const addEventListenerSpy = jest.fn();
      jest
        .spyOn(NetInfo, 'addEventListener')
        .mockImplementationOnce(addEventListenerSpy);

      const storage = makeAsyncStorage();

      if (storage && storage.onOnline) {
        storage.onOnline(() => null);
      }

      expect(addEventListenerSpy).toBeCalledTimes(1);
    });

    it('calls the callback when the device comes online', () => {
      const callbackSpy = jest.fn();
      let networkCallback;
      jest
        .spyOn(NetInfo, 'addEventListener')
        .mockImplementationOnce(callback => {
          networkCallback = callback;
          return () => null;
        });

      const storage = makeAsyncStorage();

      if (storage && storage.onOnline) {
        storage.onOnline(callbackSpy);
      }

      networkCallback({ isConnected: true });

      expect(callbackSpy).toBeCalledTimes(1);
    });

    it('does not call the callback when the device is offline', () => {
      const callbackSpy = jest.fn();
      let networkCallback;
      jest
        .spyOn(NetInfo, 'addEventListener')
        .mockImplementationOnce(callback => {
          networkCallback = callback;
          return () => null;
        });

      const storage = makeAsyncStorage();

      if (storage && storage.onOnline) {
        storage.onOnline(callbackSpy);
      }

      networkCallback({ isConnected: false });

      expect(callbackSpy).toBeCalledTimes(0);
    });
  });

  describe('clear', () => {
    it('clears all data and metadata', async () => {
      const removeItemSpy = jest.fn();
      const secondRemoveItemSpy = jest.fn();
      jest
        .spyOn(AsyncStorage, 'removeItem')
        .mockImplementationOnce(removeItemSpy)
        .mockImplementationOnce(secondRemoveItemSpy);

      const storage = makeAsyncStorage({
        dataKey: 'my-data',
        metadataKey: 'my-metadata',
      });

      if (storage && storage.clear) {
        await storage.clear();
      }

      expect(removeItemSpy).toHaveBeenCalledWith('my-data');
      expect(secondRemoveItemSpy).toHaveBeenCalledWith('my-metadata');
    });
  });
});

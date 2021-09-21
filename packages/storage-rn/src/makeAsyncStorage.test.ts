import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeAsyncStorage } from './makeAsyncStorage';

jest.mock('@react-native-community/netinfo');
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: () => 'setItem',
  getItem: () => 'getItem',
}));

const request = [
  {
    query: 'something something',
    variables: { foo: 'bar' },
  },
];
const serializedRequest =
  '[{"query":"something something","variables":{"foo":"bar"}}]';

describe('makeAsyncStorage', () => {
  describe('writeMetadata', () => {
    it('writes metadata to async storage', () => {
      const setItemSpy = jest.fn();
      jest.spyOn(AsyncStorage, 'setItem').mockImplementation(setItemSpy);

      const storage = makeAsyncStorage();

      if (storage && storage.writeMetadata) {
        storage.writeMetadata(request);
      }

      expect(setItemSpy).toHaveBeenCalledWith(
        'graphcache-metadata',
        serializedRequest
      );
    });

    it('writes metadata using a custom key key', () => {
      const setItemSpy = jest.fn();
      jest.spyOn(AsyncStorage, 'setItem').mockImplementationOnce(setItemSpy);

      const storage = makeAsyncStorage({ metadataKey: 'my-custom-key' });

      if (storage && storage.writeMetadata) {
        storage.writeMetadata(request);
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

    it('reads metadata using a custom key key', async () => {
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
});

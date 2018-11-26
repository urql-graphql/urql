import Observable from 'zen-observable-ts';
import { Exchange, Operation } from '../../types';
import { cacheExchange } from '../../exchanges';
import { Client, defaultCache } from '../../lib';

const result = {
  data: {
    item: {
      __typename: 'Item',
      id: 'item',
    },
  },
};

describe('cacheExchange', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('ignores unrelated operations', () => {
    const client = ({} as any) as Client;
    const res = Observable.of(undefined);
    const forward: Exchange = () => res;
    const exchange = cacheExchange(client, forward);

    const operation = ({
      context: {},
      key: 'test',
      operationName: 'subscription',
      query: '{ test }',
    } as any) as Operation;

    expect(exchange(operation)).toBe(res);
  });

  it('reads a query result from the passed cache first', done => {
    const testkey = 'TESTKEY';
    const cache = defaultCache({ [testkey]: result });
    const updateCacheEntry = jest.fn().mockReturnValue(Promise.resolve());
    const client = ({ cache, updateCacheEntry } as any) as Client;
    const forward: Exchange = () => Observable.of(undefined);
    const exchange = cacheExchange(client, forward);

    const operation = ({
      context: {},
      key: testkey,
      operationName: 'query',
      query: '{ test }',
    } as any) as Operation;

    exchange(operation).subscribe(res => {
      expect(res).toBe(result);
      expect(updateCacheEntry).not.toHaveBeenCalled();
      done();
    });
  });

  it('skips the cache when skipCache is set on context', done => {
    const testkey = 'TESTKEY';

    const operation = ({
      context: { skipCache: true },
      key: testkey,
      operationName: 'query',
      query: '{ test }',
    } as any) as Operation;

    const newResult = { ...result, operation, test: true };
    const cache = defaultCache({ [testkey]: result });
    const updateCacheEntry = jest.fn().mockReturnValue(Promise.resolve());
    const client = ({ cache, updateCacheEntry } as any) as Client;
    const forward: Exchange = () => Observable.of(newResult);
    const exchange = cacheExchange(client, forward);

    exchange(operation).subscribe(res => {
      expect((res as any).test).toBe(true);
      expect(updateCacheEntry).toHaveBeenCalledWith(testkey, newResult);
      done();
    });
  });

  it('records typename invalidations and invalidates parts of the cache when a mutation comes in', done => {
    const testkey = 'TESTKEY';
    const store = { unrelated: true };
    const cache = defaultCache(store);
    const updateCacheEntry = jest.fn().mockReturnValue(Promise.resolve());
    const deleteCacheKeys = jest.fn().mockReturnValue(Promise.resolve());
    const client = ({
      cache,
      updateCacheEntry,
      deleteCacheKeys,
    } as any) as Client;
    const forward: Exchange = operation =>
      Observable.of({ ...result, operation });
    const exchange = cacheExchange(client, forward);

    const operationA = ({
      context: {},
      key: testkey,
      operationName: 'query',
      query: '{ test }',
    } as any) as Operation;

    const operationB = ({
      context: {},
      key: 'anything',
      operationName: 'mutation',
      query: '{ test }',
    } as any) as Operation;

    exchange(operationA).subscribe(() => {
      expect(updateCacheEntry).toHaveBeenCalledWith(testkey, {
        ...result,
        operation: expect.any(Object),
      });

      exchange(operationB).subscribe(() => {
        expect(deleteCacheKeys).toHaveBeenCalledWith([testkey]);
        done();
      });
    });
  });
});

import Observable from 'zen-observable-ts';
import { IExchange, IOperation } from '../../interfaces/index';
import { cacheExchange } from '../../modules/cache-exchange';
import { defaultCache } from '../../modules/default-cache';

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

  it('attaches typeNames to a result', done => {
    const cache = defaultCache({});
    const forward: IExchange = () => Observable.of(result);
    const exchange = cacheExchange(cache, forward);
    const operation = ({ operationName: 'x' } as any) as IOperation;

    exchange(operation).subscribe(res => {
      expect(res.typeNames).toEqual(['Item']);
      expect(res.data).toEqual(result.data);
      done();
    });
  });

  it('reads a query result from the passed cache first', done => {
    const testkey = 'TESTKEY';
    const cache = defaultCache({ [testkey]: result });
    const forward: IExchange = () => Observable.of(undefined);
    const exchange = cacheExchange(cache, forward);

    const operation = ({
      context: {},
      key: testkey,
      operationName: 'query',
    } as any) as IOperation;

    exchange(operation).subscribe(res => {
      expect(res).toBe(result);
      done();
    });
  });

  it('skips the cache when skipCache is set on context', done => {
    const testkey = 'TESTKEY';
    const newResult = { ...result, test: true };
    const cache = defaultCache({ [testkey]: result });
    const forward: IExchange = () => Observable.of(newResult);
    const exchange = cacheExchange(cache, forward);

    const operation = ({
      context: { skipCache: true },
      key: testkey,
      operationName: 'query',
    } as any) as IOperation;

    exchange(operation).subscribe(res => {
      expect((res as any).test).toBe(true);
      expect(res.typeNames).toEqual(['Item']);
      done();
    });
  });

  it('writes query results to the cache', done => {
    const testkey = 'TESTKEY';
    const store = {};
    const cache = defaultCache(store);
    const forward: IExchange = () => Observable.of(result);
    const exchange = cacheExchange(cache, forward);

    const operation = ({
      context: {},
      key: testkey,
      operationName: 'query',
    } as any) as IOperation;

    expect(store[testkey]).toBeUndefined();

    exchange(operation).subscribe(res => {
      expect(res.data).toEqual(result.data);
      expect(store[testkey]).not.toBeUndefined();
      expect(store[testkey].data).toEqual(result.data);
      done();
    });
  });

  it('records typename invalidations and invalidates parts of the cache when a mutation comes in', done => {
    const testkey = 'TESTKEY';
    const store = { unrelated: true };
    const cache = defaultCache(store);
    const forward: IExchange = () => Observable.of(result);
    const exchange = cacheExchange(cache, forward);

    const operationA = ({
      context: {},
      key: testkey,
      operationName: 'query',
    } as any) as IOperation;

    const operationB = ({
      context: {},
      key: 'anything',
      operationName: 'mutation',
    } as any) as IOperation;

    exchange(operationA).subscribe(res => {
      expect(store[testkey]).toBe(res);
      expect(store.unrelated).toBe(true);
      exchange(operationB).subscribe(() => {
        // Disappears due to typename
        expect(store[testkey]).toBeUndefined();
        // Remains untouched
        expect(store.unrelated).toBe(true);

        done();
      });
    });
  });
});

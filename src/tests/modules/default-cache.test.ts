import { defaultCache } from '../../modules/default-cache';

describe('defaultCache', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should provide a valid cache by default', done => {
    const store = { test: 5 };
    const cache = defaultCache(store);

    Promise.all([
      cache.invalidateAll(),
      cache.read('test'),
      cache.write('test', 5),
      cache.read('test'),
      cache.update((acc, key) => {
        if (key === 'test') {
          acc[key] = 6;
        }
      }),
      cache.update(null),
      cache.read('test'),
      cache.invalidate('test'),
      cache.read('test'),
    ]).then(d => {
      expect(d).toEqual([
        undefined,
        null,
        'test',
        5,
        undefined,
        undefined,
        6,
        'test',
        null,
      ]);

      done();
    });
  });
});

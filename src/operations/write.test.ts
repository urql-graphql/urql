import Cache from '../cache';
import { cacheFixtures } from '../test-utils';
import write from './write';

cacheFixtures.forEach(fixture => {
  it(`caches ${fixture.it}`, () => {
    const cache = new Cache();
    write(cache, { query: fixture.doc }, fixture.response);
    expect(cache.toJSON()).toEqual(fixture.cache);
  });
});

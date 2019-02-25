import Cache from '../cache';
import { cacheFixtures } from '../test-utils';
import query from './query';

cacheFixtures.forEach(fixture => {
  it(`queries ${fixture.it}`, () => {
    const cache = new Cache(fixture.cache);
    const { response } = query(cache, { query: fixture.doc });
    expect(response).toEqual(fixture.response);
  });
});

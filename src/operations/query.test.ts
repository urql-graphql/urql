import Store from '../store';
import { cacheFixtures } from '../test-utils';
import query from './query';

cacheFixtures.forEach(fixture => {
  it(`queries ${fixture.it}`, () => {
    const store = new Store({ initial: fixture.cache });
    const { response } = query(store, { query: fixture.doc });
    expect(response).toEqual(fixture.response);
  });
});

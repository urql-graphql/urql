import Store from '../store';
import { cacheFixtures } from '../test-utils';
import write from './write';

cacheFixtures.forEach(fixture => {
  it(`caches ${fixture.it}`, () => {
    const store = new Store();
    write(store, { query: fixture.doc }, fixture.response);
    expect(store.toJSON()).toEqual(fixture.cache);
  });
});

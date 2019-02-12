import { createQuery } from './query';

describe('query / mutation / subscription', () => {
  it('should return a valid query object', () => {
    const val = createQuery(`{ todos { id } }`);
    expect(val).toMatchObject({ query: `{ todos { id } }`, variables: {} });
  });

  it('should return a valid query object with variables', () => {
    const val = createQuery(`{ todos { id } }`, { test: 5 });
    expect(val).toMatchObject({
      query: `{ todos { id } }`,
      variables: { test: 5 },
    });
  });
});

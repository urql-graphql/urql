import { query } from '../../modules/query';

describe('query / mutation / subscription', () => {
  it('should return a valid query object', () => {
    const val = query(`{ todos { id } }`);
    expect(val).toMatchObject({ query: `{ todos { id } }`, variables: {} });
  });

  it('should return a valid query object with variables', () => {
    const val = query(`{ todos { id } }`, { test: 5 });
    expect(val).toMatchObject({
      query: `{ todos { id } }`,
      variables: { test: 5 },
    });
  });
});

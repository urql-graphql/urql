import query from '../../modules/query';
describe('query', () => {
  it('should return a valid query object', () => {
    let val = query(`{ todos { id } }`);
    expect(val).toMatchObject({ query: `{ todos { id } }`, variables: {} });
  });

  it('should return a valid query object with variables', () => {
    let val = query(`{ todos { id } }`, { test: 5 });
    expect(val).toMatchObject({
      query: `{ todos { id } }`,
      variables: { test: 5 },
    });
  });
});

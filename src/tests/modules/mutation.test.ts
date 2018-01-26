import mutation from '../../modules/mutation';

describe('mutation', () => {
  it('should return a valid mutation object', () => {
    let val = mutation(`{ todos { id } }`);
    expect(val).toMatchObject({ query: `{ todos { id } }`, variables: {} });
  });

  it('should return a valid mutation object with variables', () => {
    let val = mutation(`{ todos { id } }`, { test: 5 });
    expect(val).toMatchObject({
      query: `{ todos { id } }`,
      variables: { test: 5 },
    });
  });
});

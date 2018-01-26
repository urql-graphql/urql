import {
  formatTypeNames,
  gankTypeNamesFromResponse,
} from '../../modules/typenames';

describe('formatTypeNames', () => {
  it('should add typenames to a query string', () => {
    let newQuery = formatTypeNames({
      query: `{ todos { id } }`,
      variables: {},
    });
    expect(newQuery.query).toBe(`{
  todos {
    id
    __typename
  }
}
`);
  });
});

describe('gankTypeNamesFromResponse', () => {
  it('should return all typenames included in a response as an array', () => {
    let typeNames = gankTypeNamesFromResponse({
      todos: [
        {
          id: 1,

          __typename: 'Todo',
        },
      ],
    });
    expect(typeNames).toMatchObject(['Todo']);
  });
});

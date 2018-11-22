import { formatTypeNames, gankTypeNamesFromResponse } from './typenames';

describe('formatTypeNames', () => {
  it('should add typenames to a query string', () => {
    expect(formatTypeNames(`{ todos { id } }`)).toBe(`{
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
    const typeNames = gankTypeNamesFromResponse({
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

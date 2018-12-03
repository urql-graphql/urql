import { formatTypeNames, gankTypeNamesFromResponse } from './typenames';

describe('formatTypeNames', () => {
  it('should add typenames to a query string', () => {
    expect(formatTypeNames(`{ todos { id } }`)).toBe(`{
  todos {
    id
    __typename
  }
  __typename
}
`);
  });
});

describe('gankTypeNamesFromResponse', () => {
  it('returns all typenames included in a response as an array', () => {
    const typeNames = gankTypeNamesFromResponse({
      todos: [
        {
          id: 1,
          __typename: 'Todo',
        },
      ],
    });
    expect(typeNames).toEqual(['Todo']);
  });

  it('does not duplicate typenames', () => {
    const typeNames = gankTypeNamesFromResponse({
      todos: [
        {
          id: 1,
          __typename: 'Todo',
        },
        {
          id: 3,
          __typename: 'Todo',
        },
      ],
    });
    expect(typeNames).toEqual(['Todo']);
  });

  it('returns multiple different typenames', () => {
    const typeNames = gankTypeNamesFromResponse({
      todos: [
        {
          id: 1,
          __typename: 'Todo',
        },
        {
          id: 3,
          __typename: 'Avocado',
        },
      ],
    });
    expect(typeNames).toEqual(['Todo', 'Avocado']);
  });

  it('works on nested objects', () => {
    const typeNames = gankTypeNamesFromResponse({
      todos: [
        {
          id: 1,
          __typename: 'Todo',
        },
        {
          id: 2,
          subTask: {
            id: 3,
            __typename: 'SubTask',
          },
        },
      ],
    });
    expect(typeNames).toEqual(['Todo', 'SubTask']);
  });
});

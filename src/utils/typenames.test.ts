import { parse, print } from 'graphql';
import { formatDocument, gankTypeNamesFromResponse } from './typenames';

const formatTypeNames = (query: string) => {
  const typedNode = formatDocument(parse(query));
  return print(typedNode);
};

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

  it('traverses nested typenames', () => {
    const typenames = gankTypeNamesFromResponse({
      todos: [
        {
          id: 1,
          author: {
            name: 'Phil',
            __typename: 'Author',
          },
          __typename: 'Todo',
        },
      ],
    });

    expect(typenames).toEqual(['Todo', 'Author']);
  });
});

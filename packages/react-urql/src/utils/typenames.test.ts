import { parse, print } from 'graphql';
import { collectTypesFromResponse, formatDocument } from './typenames';

const formatTypeNames = (query: string) => {
  const typedNode = formatDocument(parse(query));
  return print(typedNode);
};

describe('formatTypeNames', () => {
  it('adds typenames to a query string', () => {
    expect(formatTypeNames(`{ todos { id } }`)).toMatchInlineSnapshot(`
      "{
        todos {
          id
          __typename
        }
      }
      "
    `);
  });

  it('does not duplicate typenames', () => {
    expect(
      formatTypeNames(`{
      todos {
        id
        __typename
      }
    }`)
    ).toMatchInlineSnapshot(`
                  "{
                    todos {
                      id
                      __typename
                    }
                  }
                  "
            `);
  });
});

describe('collectTypesFromResponse', () => {
  it('returns all typenames included in a response as an array', () => {
    const typeNames = collectTypesFromResponse({
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
    const typeNames = collectTypesFromResponse({
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
    const typeNames = collectTypesFromResponse({
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
    const typeNames = collectTypesFromResponse({
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

  it('traverses nested arrays of objects', () => {
    const typenames = collectTypesFromResponse({
      todos: [
        {
          id: 1,
          authors: [
            [
              {
                name: 'Phil',
                __typename: 'Author',
              },
            ],
          ],
          __typename: 'Todo',
        },
      ],
    });

    expect(typenames).toEqual(['Author', 'Todo']);
  });
});

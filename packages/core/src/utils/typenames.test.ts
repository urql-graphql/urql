import { parse, print } from 'graphql';
import { collectTypesFromResponse, formatDocument } from './typenames';
import { createRequest } from './request';

const formatTypeNames = (query: string) => {
  const typedNode = formatDocument(parse(query));
  return print(typedNode);
};

describe('formatTypeNames', () => {
  it('creates a new instance when adding typenames', () => {
    const doc = parse(`{ id todos { id } }`) as any;
    const newDoc = formatDocument(doc) as any;
    expect(doc).not.toBe(newDoc);
    expect(doc.definitions).not.toBe(newDoc.definitions);
    expect(doc.definitions[0]).not.toBe(newDoc.definitions[0]);
    expect(doc.definitions[0].selectionSet).not.toBe(
      newDoc.definitions[0].selectionSet
    );
    expect(doc.definitions[0].selectionSet.selections).not.toBe(
      newDoc.definitions[0].selectionSet.selections
    );
    // Here we're equal again:
    expect(doc.definitions[0].selectionSet.selections[0]).toBe(
      newDoc.definitions[0].selectionSet.selections[0]
    );
    // Not equal again:
    expect(doc.definitions[0].selectionSet.selections[1]).not.toBe(
      newDoc.definitions[0].selectionSet.selections[1]
    );
    expect(doc.definitions[0].selectionSet.selections[1].selectionSet).not.toBe(
      newDoc.definitions[0].selectionSet.selections[1].selectionSet
    );
    // Equal again:
    expect(
      doc.definitions[0].selectionSet.selections[1].selectionSet.selections[0]
    ).toBe(
      newDoc.definitions[0].selectionSet.selections[1].selectionSet
        .selections[0]
    );
  });

  it('preserves the hashed key of the resulting query', () => {
    const doc = parse(`{ id todos { id } }`) as any;
    const expectedKey = createRequest(doc).key;
    const formattedDoc = formatDocument(doc);
    expect(formattedDoc).not.toBe(doc);
    const actualKey = createRequest(formattedDoc).key;
    expect(expectedKey).toBe(actualKey);
  });

  it('does not preserve the referential integrity with a cloned object', () => {
    const doc = parse(`{ id todos { id } }`);
    const formattedDoc = formatDocument(doc);
    expect(formattedDoc).not.toBe(doc);
    const query = { ...formattedDoc };
    const reformattedDoc = formatDocument(query);
    expect(reformattedDoc).not.toBe(doc);
  });

  it('preserves custom properties', () => {
    const doc = parse(`{ todos { id } }`) as any;
    doc.documentId = '123';
    expect((formatDocument(doc) as any).documentId).toBe(doc.documentId);
  });

  it('adds typenames to a query string', () => {
    expect(formatTypeNames(`{ todos { id } }`)).toMatchInlineSnapshot(`
      "{
        todos {
          id
          __typename
        }
      }"
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
      }"
    `);
  });

  it('does add typenames when it is aliased', () => {
    expect(
      formatTypeNames(`{
      todos {
        id
        typename: __typename
      }
    }`)
    ).toMatchInlineSnapshot(`
      "{
        todos {
          id
          typename: __typename
          __typename
        }
      }"
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

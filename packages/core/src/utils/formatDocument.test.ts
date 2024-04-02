import { Kind, parse, print } from '@0no-co/graphql.web';
import { describe, it, expect } from 'vitest';
import { createRequest } from './request';
import { formatDocument } from './formatDocument';

const formatTypeNames = (query: string) => {
  const typedNode = formatDocument(parse(query));
  return print(typedNode);
};

describe('formatDocument', () => {
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
    const expectedKey = createRequest(doc, undefined).key;
    const formattedDoc = formatDocument(doc);
    expect(formattedDoc).not.toBe(doc);
    const actualKey = createRequest(formattedDoc, undefined).key;
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

  it('processes directives', () => {
    const document = `
      {
        todos @skip {
          id @_test
        }
      }
   `;

    const node = formatDocument(parse(document));

    expect(node).toHaveProperty(
      'definitions.0.selectionSet.selections.0.selectionSet.selections.0._directives',
      {
        test: {
          kind: Kind.DIRECTIVE,
          arguments: undefined,
          name: {
            kind: Kind.NAME,
            value: '_test',
          },
        },
      }
    );

    expect(formatTypeNames(document)).toMatchInlineSnapshot(`
     "{
       todos @skip {
         id
         __typename
       }
     }"
   `);
  });
});

import { Source, parse, print } from 'graphql';
import { gql } from './gql';
import { keyDocument } from './utils';

it('parses GraphQL Documents', () => {
  const doc = gql`
    {
      gql
      testing
    }
  `;

  expect(doc.definitions).toEqual(
    parse('{ gql testing }', { noLocation: true }).definitions
  );

  expect(doc).toBe(keyDocument('{ gql testing }'));
  expect(doc.loc).toEqual({
    start: 0,
    end: 15,
    source: new Source('{ gql testing }'),
  });
});

it('interpolates nested GraphQL Documents', () => {
  expect(
    print(
      gql`
        query {
          ...Query
        }

        ${gql`
          fragment Query on Query {
            field
          }
        `}
      `
    )
  ).toMatchInlineSnapshot(`
    "{
      ...Query
    }

    fragment Query on Query {
      field
    }
    "
  `);
});

it('interpolates strings', () => {
  expect(
    print(
      gql`
        query {
          ${'field'}
        }
      `
    )
  ).toMatchInlineSnapshot(`
    "{
      field
    }
    "
  `);
});

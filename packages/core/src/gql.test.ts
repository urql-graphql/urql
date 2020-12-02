import { Source, parse, print } from 'graphql';
import { gql } from './gql';
import { keyDocument } from './utils';

it('parses GraphQL Documents', () => {
  expect(gql('{ test }').definitions).toEqual(
    parse('{ test }', { noLocation: true }).definitions
  );
  expect(gql('{ test }')).toBe(keyDocument('{ test }'));

  expect(gql('{ test }').loc).toEqual({
    start: 0,
    end: 8,
    source: new Source('{ test }', 'gql'),
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

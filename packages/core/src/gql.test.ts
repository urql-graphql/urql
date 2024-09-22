import { parse, print } from '@0no-co/graphql.web';
import { vi, expect, it, beforeEach, MockInstance } from 'vitest';

import { gql } from './gql';
import { keyDocument } from './utils';

let warn: MockInstance;

beforeEach(() => {
  warn = vi.spyOn(console, 'warn');
  warn.mockClear();
});

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

  expect(doc).toBe(keyDocument('{\n  gql\n  testing\n}'));
  expect(doc.loc).toEqual({
    start: 0,
    end: 19,
    source: expect.anything(),
  });
});

it('deduplicates fragments', () => {
  const frag = gql`
    fragment Test on Test {
      testField
    }
  `;

  const doc = gql`
    query {
      ...Test
    }

    ${frag}
    ${frag}
  `;

  expect(doc.definitions.length).toBe(2);
  expect(warn).not.toHaveBeenCalled();
});

it('warns on duplicate fragment names with different sources', () => {
  const frag = gql`
    fragment Test on Test {
      testField
    }
  `;

  const duplicate = gql`
    fragment Test on Test {
      otherField
    }
  `;

  const doc = gql`
    query {
      ...Test
    }

    ${frag}
    ${duplicate}
  `;

  expect(warn).toHaveBeenCalledTimes(1);
  expect(doc.definitions.length).toBe(2);
});

it('interpolates nested GraphQL Documents', () => {
  expect(
    print(gql`
      query {
        ...Query
      }

      ${gql`
        fragment Query on Query {
          field
        }
      `}
    `)
  ).toMatchInlineSnapshot(`
    "{
      ...Query
    }

    fragment Query on Query {
      field
    }"
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
    }"
  `);
});

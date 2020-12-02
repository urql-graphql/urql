import { gql } from '@urql/core';
import { getSelectionSet } from './node';

import { getMainOperation, shouldInclude } from './traversal';

describe('getMainOperation', () => {
  it('retrieves the first operation', () => {
    const doc = gql`
      query Query {
        field
      }
    `;
    const operation = getMainOperation(doc);
    expect(operation).toBe(doc.definitions[0]);
  });

  it('throws when no operation is found', () => {
    const doc = gql`
      fragment _ on Query {
        field
      }
    `;
    expect(() => getMainOperation(doc)).toThrow();
  });
});

describe('shouldInclude', () => {
  it('should include fields with truthy @include or falsy @skip directives', () => {
    const doc = gql`
      {
        fieldA @include(if: true)
        fieldB @skip(if: false)
      }
    `;
    const fieldA = getSelectionSet(getMainOperation(doc))[0];
    const fieldB = getSelectionSet(getMainOperation(doc))[1];
    expect(shouldInclude(fieldA, {})).toBe(true);
    expect(shouldInclude(fieldB, {})).toBe(true);
  });

  it('should exclude fields with falsy @include or truthy @skip directives', () => {
    const doc = gql`
      {
        fieldA @include(if: false)
        fieldB @skip(if: true)
      }
    `;
    const fieldA = getSelectionSet(getMainOperation(doc))[0];
    const fieldB = getSelectionSet(getMainOperation(doc))[1];
    expect(shouldInclude(fieldA, {})).toBe(false);
    expect(shouldInclude(fieldB, {})).toBe(false);
  });

  it('ignore other directives', () => {
    const doc = gql`
      {
        field @test(if: false)
      }
    `;
    const field = getSelectionSet(getMainOperation(doc))[0];
    expect(shouldInclude(field, {})).toBe(true);
  });

  it('ignore unknown arguments on directives', () => {
    const doc = gql`
      {
        field @skip(if: true, other: false)
      }
    `;
    const field = getSelectionSet(getMainOperation(doc))[0];
    expect(shouldInclude(field, {})).toBe(false);
  });

  it('ignore directives with invalid first arguments', () => {
    const doc = gql`
      {
        field @skip(other: true)
      }
    `;
    const field = getSelectionSet(getMainOperation(doc))[0];
    expect(shouldInclude(field, {})).toBe(true);
  });
});

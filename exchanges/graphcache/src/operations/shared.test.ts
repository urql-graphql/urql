import { describe, it, expect } from 'vitest';
import {
  TypedDocumentNode,
  FormattedNode,
  formatDocument,
  gql,
} from '@urql/core';
import { FieldNode } from '@0no-co/graphql.web';

import { SelectionIterator, deferRef } from './shared';
import { SelectionSet } from '../ast';

const selectionOfDocument = (
  doc: TypedDocumentNode
): FormattedNode<SelectionSet> => {
  for (const definition of formatDocument(doc).definitions)
    if (definition.kind === 'OperationDefinition')
      return definition.selectionSet.selections as FormattedNode<SelectionSet>;
  return [];
};

const ctx = {} as any;

describe('SelectionIterator', () => {
  it('emits all fields', () => {
    const selection = selectionOfDocument(gql`
      {
        a
        b
        c
      }
    `);
    const iterate = new SelectionIterator(
      'Query',
      'Query',
      false,
      undefined,
      selection,
      ctx
    );
    const result: FieldNode[] = [];

    let node: FieldNode | void;
    while ((node = iterate.next())) result.push(node);

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "alias": undefined,
          "arguments": undefined,
          "directives": undefined,
          "kind": "Field",
          "name": {
            "kind": "Name",
            "value": "a",
          },
          "selectionSet": undefined,
        },
        {
          "alias": undefined,
          "arguments": undefined,
          "directives": undefined,
          "kind": "Field",
          "name": {
            "kind": "Name",
            "value": "b",
          },
          "selectionSet": undefined,
        },
        {
          "alias": undefined,
          "arguments": undefined,
          "directives": undefined,
          "kind": "Field",
          "name": {
            "kind": "Name",
            "value": "c",
          },
          "selectionSet": undefined,
        },
      ]
    `);
  });

  it('skips fields that are skipped or not included', () => {
    const selection = selectionOfDocument(gql`
      {
        a @skip(if: true)
        b @include(if: false)
      }
    `);

    const iterate = new SelectionIterator(
      'Query',
      'Query',
      false,
      undefined,
      selection,
      ctx
    );
    const result: FieldNode[] = [];

    let node: FieldNode | void;
    while ((node = iterate.next())) result.push(node);

    expect(result).toMatchInlineSnapshot('[]');
  });

  it('processes fragments', () => {
    const selection = selectionOfDocument(gql`
      {
        a
        ... {
          b
        }
        ... {
          ... {
            c
          }
        }
      }
    `);

    const iterate = new SelectionIterator(
      'Query',
      'Query',
      false,
      undefined,
      selection,
      ctx
    );
    const result: FieldNode[] = [];

    let node: FieldNode | void;
    while ((node = iterate.next())) result.push(node);

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "alias": undefined,
          "arguments": undefined,
          "directives": undefined,
          "kind": "Field",
          "name": {
            "kind": "Name",
            "value": "a",
          },
          "selectionSet": undefined,
        },
        {
          "alias": undefined,
          "arguments": undefined,
          "directives": undefined,
          "kind": "Field",
          "name": {
            "kind": "Name",
            "value": "b",
          },
          "selectionSet": undefined,
        },
        {
          "alias": undefined,
          "arguments": undefined,
          "directives": undefined,
          "kind": "Field",
          "name": {
            "kind": "Name",
            "value": "c",
          },
          "selectionSet": undefined,
        },
      ]
    `);
  });

  it('updates deferred state as needed', () => {
    const selection = selectionOfDocument(gql`
      {
        a
        ... @defer {
          b
        }
        ... {
          ... @defer {
            c
          }
        }
        ... {
          ... {
            d
          }
        }
        ... @defer {
          ... {
            e
          }
        }
        ... {
          ... {
            f
          }
        }
        ... {
          g
        }
        h
      }
    `);

    const iterate = new SelectionIterator(
      'Query',
      'Query',
      false,
      undefined,
      selection,
      ctx
    );

    const deferred: boolean[] = [];
    while (iterate.next()) deferred.push(deferRef);
    expect(deferred).toEqual([
      false, // a
      true, // b
      true, // c
      false, // d
      true, // e
      false, // f
      false, // g
      false, // h
    ]);
  });

  it('applies the parent’s defer state if needed', () => {
    const selection = selectionOfDocument(gql`
      {
        a
        ... @defer {
          b
        }
        ... {
          c
        }
      }
    `);

    const iterate = new SelectionIterator(
      'Query',
      'Query',
      true,
      undefined,
      selection,
      ctx
    );

    const deferred: boolean[] = [];
    while (iterate.next()) deferred.push(deferRef);
    expect(deferred).toEqual([true, true, true]);
  });
});

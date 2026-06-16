import { describe, it, expect } from 'vitest';
import type { FieldNode, FragmentDefinitionNode } from '@0no-co/graphql.web';
import { Kind } from '@0no-co/graphql.web';

import { gql } from '../gql';
import {
  getFieldKey,
  getFragments,
  hasDirective,
  isHeuristicFragmentMatch,
  isOptionalSelection,
} from './selection';

const fieldsOf = (source: string): Record<string, FieldNode> => {
  const document = gql(source);
  const fragment = document.definitions.find(
    definition => definition.kind === Kind.FRAGMENT_DEFINITION
  ) as FragmentDefinitionNode;
  const map: Record<string, FieldNode> = {};
  fragment.selectionSet.selections.forEach(selection => {
    if (selection.kind === Kind.FIELD) map[getFieldKey(selection)] = selection;
  });
  return map;
};

describe('getFragments', () => {
  it('maps fragment names to their definitions', () => {
    const document = gql`
      fragment A on X {
        id
      }
      fragment B on Y {
        id
      }
    `;
    const fragments = getFragments(document.definitions);
    expect(Object.keys(fragments).sort()).toEqual(['A', 'B']);
    expect(fragments.A.name.value).toBe('A');
  });
});

describe('getFieldKey', () => {
  it('returns the alias when present, otherwise the field name', () => {
    const fields = fieldsOf(`fragment F on T { name alias: other }`);
    expect(fields.name.name.value).toBe('name');
    expect(fields.alias.name.value).toBe('other');
  });
});

describe('hasDirective', () => {
  it('detects a directive by name on the raw AST', () => {
    const fields = fieldsOf(`fragment F on T { a @defer b }`);
    expect(hasDirective(fields.a, 'defer')).toBe(true);
    expect(hasDirective(fields.b, 'defer')).toBe(false);
  });
});

describe('isOptionalSelection', () => {
  it('is true for @include/@skip and false otherwise', () => {
    const fields = fieldsOf(
      `fragment F on T { a @include(if: true) b @skip(if: false) c }`
    );
    expect(isOptionalSelection(fields.a)).toBe(true);
    expect(isOptionalSelection(fields.b)).toBe(true);
    expect(isOptionalSelection(fields.c)).toBe(false);
  });
});

describe('isHeuristicFragmentMatch', () => {
  const fragment = getFragments(gql`
    fragment AuthorFields on Author {
      id
      name
      __typename
    }
  `.definitions).AuthorFields;

  it('matches when the type condition equals __typename', () => {
    expect(
      isHeuristicFragmentMatch(fragment, { __typename: 'Author' }, {})
    ).toBe(true);
  });

  it('matches heuristically when every selected field is present', () => {
    expect(
      isHeuristicFragmentMatch(
        fragment,
        { __typename: 'Other', id: '1', name: 'x' },
        {}
      )
    ).toBe(true);
  });

  it('does not match when a selected field is missing', () => {
    expect(
      isHeuristicFragmentMatch(fragment, { __typename: 'Other', id: '1' }, {})
    ).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import type {
  FragmentDefinitionNode,
  SelectionSetNode,
} from '@0no-co/graphql.web';
import { Kind } from '@0no-co/graphql.web';

import { gql } from '../gql';
import { getFragments, type FragmentMap } from './selection';
import { maskFragment } from './maskFragment';

const fromDocument = (
  source: string,
  name?: string
): { selectionSet: SelectionSetNode; fragments: FragmentMap } => {
  const document = gql(source);
  const fragments = getFragments(document.definitions);
  const fragment = document.definitions.find(
    definition =>
      definition.kind === Kind.FRAGMENT_DEFINITION &&
      (!name || definition.name.value === name)
  ) as FragmentDefinitionNode;
  return { selectionSet: fragment.selectionSet, fragments };
};

const mask = (source: string, data: any, name?: string) => {
  const { selectionSet, fragments } = fromDocument(source, name);
  return maskFragment(data, selectionSet, fragments);
};

describe('maskFragment', () => {
  it('masks data to the selected fields', () => {
    const result = mask(`fragment TodoFields on Todo { id name __typename }`, {
      __typename: 'Todo',
      id: '1',
      name: 'Learn urql',
      completed: true,
    });

    expect(result.fulfilled).toBe(true);
    expect(result.data).toEqual({
      __typename: 'Todo',
      id: '1',
      name: 'Learn urql',
    });
  });

  it('preserves null fields', () => {
    const result = mask(`fragment TodoFields on Todo { id name __typename }`, {
      __typename: 'Todo',
      id: '1',
      name: null,
      completed: true,
    });

    expect(result.fulfilled).toBe(true);
    expect(result.data).toEqual({ __typename: 'Todo', id: '1', name: null });
  });

  it('reports an unfulfilled result for an undefined non-optional field', () => {
    const result = mask(`fragment TodoFields on Todo { id name __typename }`, {
      __typename: 'Todo',
      id: '1',
      name: undefined,
      completed: true,
    });

    expect(result.fulfilled).toBe(false);
    expect(result.data).toEqual({ __typename: 'Todo', id: '1' });
  });

  it('masks nested objects', () => {
    const result = mask(
      `fragment TodoFields on Todo { id __typename author { id name __typename } }`,
      {
        __typename: 'Todo',
        id: '1',
        author: {
          __typename: 'Author',
          id: '1',
          name: 'Jovi',
          awardWinner: true,
        },
      }
    );

    expect(result.fulfilled).toBe(true);
    expect(result.data).toEqual({
      __typename: 'Todo',
      id: '1',
      author: { __typename: 'Author', id: '1', name: 'Jovi' },
    });
  });

  it('passes through a null nested selection', () => {
    const result = mask(
      `fragment TodoFields on Todo { id __typename author { id __typename } }`,
      { __typename: 'Todo', id: '1', author: null }
    );

    expect(result.fulfilled).toBe(true);
    expect(result.data).toEqual({ __typename: 'Todo', id: '1', author: null });
  });

  it('preserves null items in nullable lists', () => {
    const result = mask(
      `fragment TodoFields on Todo { id __typename assignees { id name __typename } }`,
      {
        __typename: 'Todo',
        id: '1',
        assignees: [
          null,
          { __typename: 'User', id: '2', name: 'Jovi', role: 'admin' },
        ],
      }
    );

    expect(result.fulfilled).toBe(true);
    expect(result.data).toEqual({
      __typename: 'Todo',
      id: '1',
      assignees: [null, { __typename: 'User', id: '2', name: 'Jovi' }],
    });
  });

  it('reports an unfulfilled result for an undefined nested selection', () => {
    const result = mask(
      `fragment TodoFields on Todo { id __typename author { id __typename } }`,
      { __typename: 'Todo', id: '1', author: undefined }
    );

    expect(result.fulfilled).toBe(false);
    expect(result.data).toEqual({ __typename: 'Todo', id: '1' });
  });

  it('treats a missing @defer-red fragment spread as fulfilled', () => {
    const result = mask(
      `
        fragment TodoFields on Todo {
          id name __typename
          ...AuthorFields @defer
        }

        fragment AuthorFields on Todo { author { id name __typename } }
      `,
      { __typename: 'Todo', id: '1', name: null, author: undefined },
      'TodoFields'
    );

    expect(result.fulfilled).toBe(true);
    expect(result.data).toEqual({ __typename: 'Todo', id: '1', name: null });
  });

  it('treats a missing non-deferred fragment spread as unfulfilled', () => {
    const result = mask(
      `
        fragment TodoFields on Todo {
          id name __typename
          ...AuthorFields
        }

        fragment AuthorFields on Todo { author { id name __typename } }
      `,
      { __typename: 'Todo', id: '1', name: null, author: undefined },
      'TodoFields'
    );

    expect(result.fulfilled).toBe(false);
    expect(result.data).toEqual({ __typename: 'Todo', id: '1', name: null });
  });
});

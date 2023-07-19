import { formatDocument, gql } from '@urql/core';
import { it, afterEach, expect } from 'vitest';
import { __initAnd_query as query } from '../operations/query';
import { __initAnd_write as write } from '../operations/write';
import { Store } from '../store/store';

afterEach(() => {
  expect(console.warn).not.toHaveBeenCalled();
});

it('allows viewer fields to overwrite the root Query data', () => {
  const store = new Store();
  const get = formatDocument(gql`
    {
      int
    }
  `);
  const set = formatDocument(gql`
    mutation {
      mutate {
        viewer {
          int
        }
      }
    }
  `);

  write(
    store,
    { query: get },
    {
      __typename: 'Query',
      int: 42,
    }
  );

  write(
    store,
    { query: set },
    {
      __typename: 'Mutation',
      mutate: {
        __typename: 'MutateResult',
        viewer: {
          __typename: 'Query',
          int: 43,
        },
      },
    }
  );

  const res = query(store, { query: get });

  expect(res.partial).toBe(false);
  expect(res.data).toEqual({
    int: 43,
  });
});

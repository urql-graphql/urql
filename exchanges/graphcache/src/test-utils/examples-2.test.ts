import { gql } from '@urql/core';
import { query, write } from '../operations';
import { Store } from '../store';

const Item = gql`
  {
    todo {
      __typename
      id
      complete
      text
    }
  }
`;

const ItemDetailed = gql`
  {
    todo {
      __typename
      id
      details {
        __typename
        authors {
          __typename
          id
        }
      }
    }
  }
`;

const Pagination = gql`
  query {
    todos {
      __typename
      edges {
        __typename
        node {
          __typename
          id
          complete
          text
        }
      }
      pageInfo {
        __typename
        hasNextPage
        endCursor
      }
    }
  }
`;

afterEach(() => {
  expect(console.warn).not.toHaveBeenCalled();
});

it('allows custom resolvers to resolve nested, unkeyed data', () => {
  const store = new Store({
    resolvers: {
      Query: {
        todos: () => ({
          __typename: 'TodosConnection',
          edges: [
            {
              __typename: 'TodoEdge',
              node: {
                __typename: 'Todo',
                id: '1',
                // The `complete` field will be overwritten here, but we're
                // leaving out the `text` field
                complete: true,
              },
            },
          ],
          pageInfo: {
            __typename: 'PageInfo',
            hasNextPage: true,
            endCursor: '1',
          },
        }),
      },
    },
  });

  write(
    store,
    { query: Item },
    {
      __typename: 'Query',
      todo: {
        __typename: 'Todo',
        id: '1',
        complete: false,
        text: 'Example',
      },
    }
  );

  const res = query(store, { query: Pagination });

  expect(res.partial).toBe(false);

  expect(res.data).toEqual({
    todos: {
      __typename: 'TodosConnection',
      edges: [
        {
          __typename: 'TodoEdge',
          node: {
            __typename: 'Todo',
            id: '1',
            complete: true, // This is now true and not false!
            text: 'Example', // This is still present
          },
        },
      ],
      pageInfo: {
        __typename: 'PageInfo',
        hasNextPage: true,
        endCursor: '1',
      },
    },
  });
});

it('allows custom resolvers to resolve nested, unkeyed data with embedded links', () => {
  const store = new Store({
    resolvers: {
      Query: {
        todos: (_, __, cache) => ({
          __typename: 'TodosConnection',
          edges: [
            {
              __typename: 'TodoEdge',
              // This is a key instead of the full entity:
              node: cache.keyOfEntity({ __typename: 'Todo', id: '1' }),
            },
          ],
          pageInfo: {
            __typename: 'PageInfo',
            hasNextPage: true,
            endCursor: '1',
          },
        }),
      },
    },
  });

  write(
    store,
    { query: Item },
    {
      __typename: 'Query',
      todo: {
        __typename: 'Todo',
        id: '1',
        complete: false,
        text: 'Example',
      },
    }
  );

  const res = query(store, { query: Pagination });
  expect(res.partial).toBe(false);
  expect(res.data).toEqual({
    todos: {
      __typename: 'TodosConnection',
      edges: [
        {
          __typename: 'TodoEdge',
          node: {
            __typename: 'Todo',
            id: '1',
            complete: false,
            text: 'Example',
          },
        },
      ],
      pageInfo: {
        __typename: 'PageInfo',
        hasNextPage: true,
        endCursor: '1',
      },
    },
  });
});

it('allows custom resolvers to resolve mixed data (keyable and unkeyable)', () => {
  const store = new Store({
    keys: {
      TodoDetails: () => null,
    },
    resolvers: {
      Query: {
        todo: () => ({
          __typename: 'Todo',
          id: '1',
          details: {
            __typename: 'TodoDetails',
          },
        }),
      },
    },
  });

  write(
    store,
    { query: ItemDetailed },
    {
      __typename: 'Query',
      todo: {
        __typename: 'Todo',
        id: '1',
        details: {
          __typename: 'TodoDetails',
          authors: [
            {
              __typename: 'Author',
              id: 'x',
            },
          ],
        },
      },
    }
  );

  const res = query(store, { query: ItemDetailed });
  expect(res.partial).toBe(false);
  expect(res.dependencies).toHaveProperty('Author:x', true);
  expect(res.data).toEqual({
    todo: {
      __typename: 'Todo',
      id: '1',
      details: {
        __typename: 'TodoDetails',
        authors: [
          {
            __typename: 'Author',
            id: 'x',
          },
        ],
      },
    },
  });
});

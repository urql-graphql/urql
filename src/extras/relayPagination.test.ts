import gql from 'graphql-tag';
import { query, write } from '../operations';
import { Store } from '../store';
import { relayPagination } from './relayPagination';

it('works with forward pagination', () => {
  const Pagination = gql`
    query($cursor: String) {
      items(first: 1, after: $cursor) {
        __typename
        edges {
          __typename
          node {
            __typename
            id
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

  const store = new Store(undefined, {
    Query: {
      items: relayPagination(),
    },
  });

  const pageOne = {
    __typename: 'Query',
    items: {
      __typename: 'ItemsConnection',
      edges: [
        {
          __typename: 'ItemEdge',
          node: {
            __typename: 'Item',
            id: '1',
          },
        },
      ],
      pageInfo: {
        __typename: 'PageInfo',
        hasNextPage: true,
        endCursor: '1',
      },
    },
  };

  const pageTwo = {
    __typename: 'Query',
    items: {
      __typename: 'ItemsConnection',
      edges: [
        {
          __typename: 'ItemEdge',
          node: {
            __typename: 'Item',
            id: '2',
          },
        },
      ],
      pageInfo: {
        __typename: 'PageInfo',
        hasNextPage: false,
        endCursor: null,
      },
    },
  };

  write(store, { query: Pagination, variables: { cursor: null } }, pageOne);
  write(store, { query: Pagination, variables: { cursor: '1' } }, pageTwo);

  const res = query(store, { query: Pagination });

  expect(res.partial).toBe(false);
  expect(res.data).toEqual({
    ...pageTwo,
    items: {
      ...pageTwo.items,
      edges: [pageOne.items.edges[0], pageTwo.items.edges[0]],
    },
  });
});

it('works with backwards pagination', () => {
  const Pagination = gql`
    query($cursor: String) {
      items(last: 1, before: $cursor) {
        __typename
        edges {
          __typename
          node {
            __typename
            id
          }
        }
        pageInfo {
          __typename
          hasPreviousPage
          startCursor
        }
      }
    }
  `;

  const store = new Store(undefined, {
    Query: {
      items: relayPagination(),
    },
  });

  const pageOne = {
    __typename: 'Query',
    items: {
      __typename: 'ItemsConnection',
      edges: [
        {
          __typename: 'ItemEdge',
          node: {
            __typename: 'Item',
            id: '2',
          },
        },
      ],
      pageInfo: {
        __typename: 'PageInfo',
        hasPreviousPage: true,
        startCursor: '2',
      },
    },
  };

  const pageTwo = {
    __typename: 'Query',
    items: {
      __typename: 'ItemsConnection',
      edges: [
        {
          __typename: 'ItemEdge',
          node: {
            __typename: 'Item',
            id: '1',
          },
        },
      ],
      pageInfo: {
        __typename: 'PageInfo',
        hasPreviousPage: false,
        startCursor: null,
      },
    },
  };

  write(store, { query: Pagination, variables: { cursor: null } }, pageOne);
  write(store, { query: Pagination, variables: { cursor: '2' } }, pageTwo);

  const res = query(store, { query: Pagination });

  expect(res.partial).toBe(false);
  expect(res.data).toEqual({
    ...pageTwo,
    items: {
      ...pageTwo.items,
      edges: [pageTwo.items.edges[0], pageOne.items.edges[0]],
    },
  });
});

it('handles duplicate edges', () => {
  const Pagination = gql`
    query($cursor: String) {
      items(first: 2, after: $cursor) {
        __typename
        edges {
          __typename
          node {
            __typename
            id
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

  const store = new Store(undefined, {
    Query: {
      items: relayPagination(),
    },
  });

  const pageOne = {
    __typename: 'Query',
    items: {
      __typename: 'ItemsConnection',
      edges: [
        {
          __typename: 'ItemEdge',
          node: {
            __typename: 'Item',
            id: '1',
          },
        },
        {
          __typename: 'ItemEdge',
          node: {
            __typename: 'Item',
            id: '2',
          },
        },
      ],
      pageInfo: {
        __typename: 'PageInfo',
        hasNextPage: true,
        endCursor: '2',
      },
    },
  };

  const pageTwo = {
    __typename: 'Query',
    items: {
      __typename: 'ItemsConnection',
      edges: [
        {
          __typename: 'ItemEdge',
          node: {
            __typename: 'Item',
            id: '2',
          },
        },
        {
          __typename: 'ItemEdge',
          node: {
            __typename: 'Item',
            id: '3',
          },
        },
      ],
      pageInfo: {
        __typename: 'PageInfo',
        hasNextPage: false,
        endCursor: null,
      },
    },
  };

  write(store, { query: Pagination, variables: { cursor: null } }, pageOne);
  write(store, { query: Pagination, variables: { cursor: '1' } }, pageTwo);

  const res = query(store, { query: Pagination });

  expect(res.partial).toBe(false);
  expect(res.data).toEqual({
    ...pageTwo,
    items: {
      ...pageTwo.items,
      edges: [
        pageOne.items.edges[0],
        pageTwo.items.edges[0],
        pageTwo.items.edges[1],
      ],
    },
  });
});

it('works with simultaneous forward and backward pagination (outwards merging)', () => {
  const Pagination = gql`
    query($first: Int, $last: Int, $before: String, $after: String) {
      items(first: $first, last: $last, before: $before, after: $after) {
        __typename
        edges {
          __typename
          node {
            __typename
            id
          }
        }
        pageInfo {
          __typename
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
      }
    }
  `;

  const store = new Store(undefined, {
    Query: {
      items: relayPagination({ mergeMode: 'outwards' }),
    },
  });

  const pageOne = {
    __typename: 'Query',
    items: {
      __typename: 'ItemsConnection',
      edges: [
        {
          __typename: 'ItemEdge',
          node: {
            __typename: 'Item',
            id: '1',
          },
        },
      ],
      pageInfo: {
        __typename: 'PageInfo',
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: '1',
      },
    },
  };

  const pageTwo = {
    __typename: 'Query',
    items: {
      __typename: 'ItemsConnection',
      edges: [
        {
          __typename: 'ItemEdge',
          node: {
            __typename: 'Item',
            id: '2',
          },
        },
      ],
      pageInfo: {
        __typename: 'PageInfo',
        hasNextPage: true,
        hasPreviousPage: true,
        startCursor: '2',
        endCursor: '2',
      },
    },
  };

  const pageThree = {
    __typename: 'Query',
    items: {
      __typename: 'ItemsConnection',
      edges: [
        {
          __typename: 'ItemEdge',
          node: {
            __typename: 'Item',
            id: '-1',
          },
        },
      ],
      pageInfo: {
        __typename: 'PageInfo',
        hasNextPage: false,
        hasPreviousPage: true,
        startCursor: '-1',
        endCursor: null,
      },
    },
  };

  write(
    store,
    { query: Pagination, variables: { after: '1', first: 1 } },
    pageOne
  );
  write(
    store,
    { query: Pagination, variables: { after: '2', first: 1 } },
    pageTwo
  );
  write(
    store,
    { query: Pagination, variables: { before: '1', last: 1 } },
    pageThree
  );

  const res = query(store, {
    query: Pagination,
    variables: { before: '1', last: 1 },
  });

  expect(res.partial).toBe(false);
  expect(res.data).toEqual({
    ...pageThree,
    items: {
      ...pageThree.items,
      edges: [
        pageThree.items.edges[0],
        pageOne.items.edges[0],
        pageTwo.items.edges[0],
      ],
      pageInfo: {
        ...pageThree.items.pageInfo,
        hasPreviousPage: true,
        hasNextPage: true,
        startCursor: '-1',
        endCursor: '2',
      },
    },
  });
});

it('works with simultaneous forward and backward pagination (inwards merging)', () => {
  const Pagination = gql`
    query($first: Int, $last: Int, $before: String, $after: String) {
      items(first: $first, last: $last, before: $before, after: $after) {
        __typename
        edges {
          __typename
          node {
            __typename
            id
          }
        }
        pageInfo {
          __typename
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
      }
    }
  `;

  const store = new Store(undefined, {
    Query: {
      items: relayPagination({ mergeMode: 'inwards' }),
    },
  });

  const pageOne = {
    __typename: 'Query',
    items: {
      __typename: 'ItemsConnection',
      edges: [
        {
          __typename: 'ItemEdge',
          node: {
            __typename: 'Item',
            id: '1',
          },
        },
      ],
      pageInfo: {
        __typename: 'PageInfo',
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: '1',
      },
    },
  };

  const pageTwo = {
    __typename: 'Query',
    items: {
      __typename: 'ItemsConnection',
      edges: [
        {
          __typename: 'ItemEdge',
          node: {
            __typename: 'Item',
            id: '2',
          },
        },
      ],
      pageInfo: {
        __typename: 'PageInfo',
        hasNextPage: true,
        hasPreviousPage: true,
        startCursor: '2',
        endCursor: '2',
      },
    },
  };

  const pageThree = {
    __typename: 'Query',
    items: {
      __typename: 'ItemsConnection',
      edges: [
        {
          __typename: 'ItemEdge',
          node: {
            __typename: 'Item',
            id: '-1',
          },
        },
      ],
      pageInfo: {
        __typename: 'PageInfo',
        hasNextPage: false,
        hasPreviousPage: true,
        startCursor: '-1',
        endCursor: null,
      },
    },
  };

  write(
    store,
    { query: Pagination, variables: { after: '1', first: 1 } },
    pageOne
  );
  write(
    store,
    { query: Pagination, variables: { after: '2', first: 1 } },
    pageTwo
  );
  write(
    store,
    { query: Pagination, variables: { before: '1', last: 1 } },
    pageThree
  );

  const res = query(store, {
    query: Pagination,
    variables: { before: '1', last: 1 },
  });

  expect(res.partial).toBe(false);
  expect(res.data).toEqual({
    ...pageThree,
    items: {
      ...pageThree.items,
      edges: [
        pageOne.items.edges[0],
        pageTwo.items.edges[0],
        pageThree.items.edges[0],
      ],
      pageInfo: {
        ...pageThree.items.pageInfo,
        hasPreviousPage: true,
        hasNextPage: true,
        startCursor: '-1',
        endCursor: '2',
      },
    },
  });
});

it('prevents overlapping of pagination on different arguments', () => {
  const Pagination = gql`
    query($filter: String) {
      items(first: 1, filter: $filter) {
        __typename
        edges {
          __typename
          node {
            __typename
            id
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

  const store = new Store(undefined, {
    Query: {
      items: relayPagination(),
    },
  });

  const page = withId => ({
    __typename: 'Query',
    items: {
      __typename: 'ItemsConnection',
      edges: [
        {
          __typename: 'ItemEdge',
          node: {
            __typename: 'Item',
            id: `${withId}`,
          },
        },
      ],
      pageInfo: {
        __typename: 'PageInfo',
        hasNextPage: false,
        endCursor: null,
      },
    },
  });

  write(
    store,
    { query: Pagination, variables: { filter: 'one' } },
    page('one')
  );
  write(
    store,
    { query: Pagination, variables: { filter: 'two' } },
    page('two')
  );

  const resOne = query(store, {
    query: Pagination,
    variables: { filter: 'one' },
  });
  const resTwo = query(store, {
    query: Pagination,
    variables: { filter: 'two' },
  });
  const resThree = query(store, {
    query: Pagination,
    variables: { filter: 'three' },
  });

  expect(resOne.data).toHaveProperty(
    ['items', 'edges', 0, 'node', 'id'],
    'one'
  );
  expect(resOne.data).toHaveProperty('items.edges.length', 1);

  expect(resTwo.data).toHaveProperty(
    ['items', 'edges', 0, 'node', 'id'],
    'two'
  );
  expect(resTwo.data).toHaveProperty('items.edges.length', 1);

  expect(resThree.data).toEqual({
    __typename: 'Query',
    items: null,
  });
});

it('returns an empty array of edges when the cache has zero edges stored', () => {
  const Pagination = gql`
    query {
      items(first: 1) {
        __typename
        edges {
          __typename
        }
      }
    }
  `;

  const store = new Store(undefined, {
    Query: {
      items: relayPagination(),
    },
  });

  write(
    store,
    { query: Pagination },
    {
      __typename: 'Query',
      items: {
        __typename: 'ItemsConnection',
        edges: [],
      },
    }
  );

  const res = query(store, {
    query: Pagination,
  });

  expect(res.data).toHaveProperty('items', {
    __typename: 'ItemsConnection',
    edges: [],
  });
});

it('returns other fields on the same level as the edges', () => {
  const Pagination = gql`
    query {
      items(first: 1) {
        totalCount
      }
    }
  `;

  const store = new Store(undefined, {
    Query: {
      items: relayPagination(),
    },
  });

  write(
    store,
    { query: Pagination },
    {
      __typename: 'Query',
      items: {
        __typename: 'ItemsConnection',
        totalCount: 2,
      },
    }
  );

  const resOne = query(store, {
    query: Pagination,
  });

  expect(resOne.data).toHaveProperty('items', {
    __typename: 'ItemsConnection',
    totalCount: 2,
  });
});

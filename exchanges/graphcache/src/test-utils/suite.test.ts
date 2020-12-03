import { DocumentNode } from 'graphql';
import { gql } from '@urql/core';
import { query, write } from '../operations';
import { Store } from '../store';

interface TestCase {
  query: DocumentNode;
  variables?: any;
  data: any;
}

const expectCacheIntegrity = (testcase: TestCase) => {
  const store = new Store();
  const request = { query: testcase.query, variables: testcase.variables };
  const writeRes = write(store, request, testcase.data);
  const queryRes = query(store, request);
  expect(queryRes.data).not.toBe(null);
  expect(queryRes.data).toEqual(testcase.data);
  expect(queryRes.partial).toBe(false);
  expect(queryRes.dependencies).toEqual(writeRes.dependencies);
};

it('int on query', () => {
  expectCacheIntegrity({
    query: gql`
      {
        __typename
        int
      }
    `,
    data: { __typename: 'Query', int: 42 },
  });
});

it('aliased field on query', () => {
  expectCacheIntegrity({
    query: gql`
      {
        __typename
        anotherName: int
      }
    `,
    data: { __typename: 'Query', anotherName: 42 },
  });
});

it('@skip directive on field on query', () => {
  expectCacheIntegrity({
    query: gql`
      {
        __typename
        intA @skip(if: true)
        intB @skip(if: false)
      }
    `,
    data: { __typename: 'Query', intB: 2 },
  });
});

it('@include directive on field on query', () => {
  expectCacheIntegrity({
    query: gql`
      {
        __typename
        intA @include(if: true)
        intB @include(if: false)
      }
    `,
    data: { __typename: 'Query', intA: 2 },
  });
});

it('random directive on field on query', () => {
  expectCacheIntegrity({
    query: gql`
      {
        __typename
        int @shouldntMatter
      }
    `,
    data: { __typename: 'Query', int: 1 },
  });
});

it('json on query', () => {
  expectCacheIntegrity({
    query: gql`
      {
        __typename
        json
      }
    `,
    // The `__typename` field should not mislead the cache
    data: {
      __typename: 'Query',
      json: { __typename: 'Misleading', test: true },
    },
  });
});

it('nullable field on query', () => {
  expectCacheIntegrity({
    query: gql`
      {
        __typename
        missing
      }
    `,
    data: { __typename: 'Query', missing: null },
  });
});

it('int field with arguments on query', () => {
  expectCacheIntegrity({
    query: gql`
      {
        __typename
        int(test: true)
      }
    `,
    data: { __typename: 'Query', int: 42 },
  });
});

it('non-keyable entity on query', () => {
  expectCacheIntegrity({
    query: gql`
      {
        __typename
        item {
          __typename
          name
        }
      }
    `,
    // This entity has no `id` or `_id` field
    data: { __typename: 'Query', item: { __typename: 'Item', name: 'Test' } },
  });
});

it('non-IDable entity on query', () => {
  expectCacheIntegrity({
    query: gql`
      {
        __typename
        item {
          __typename
          name
        }
      }
    `,
    // This entity has a `__typename` but no ID fields
    data: { __typename: 'Query', item: { __typename: 'Item', name: 'Test' } },
  });
});

it('entity on query', () => {
  expectCacheIntegrity({
    query: gql`
      {
        __typename
        item {
          __typename
          id
          name
        }
      }
    `,
    data: {
      __typename: 'Query',
      item: { __typename: 'Item', id: '1', name: 'Test' },
    },
  });
});

it('entity on aliased field on query', () => {
  expectCacheIntegrity({
    query: gql`
      {
        __typename
        anotherName: item {
          __typename
          id
          name
        }
      }
    `,
    data: {
      __typename: 'Query',
      anotherName: { __typename: 'Item', id: '1', name: 'Test' },
    },
  });
});

it('entity with arguments on query', () => {
  expectCacheIntegrity({
    query: gql`
      {
        __typename
        item(test: true) {
          __typename
          id
          name
        }
      }
    `,
    data: {
      __typename: 'Query',
      item: { __typename: 'Item', id: '1', name: 'Test' },
    },
  });
});

it('entity with Int-like ID on query', () => {
  expectCacheIntegrity({
    query: gql`
      {
        __typename
        item {
          __typename
          id
          name
        }
      }
    `,
    // This is the same as above, but with a number on `id`
    data: {
      __typename: 'Query',
      item: { __typename: 'Item', id: 1, name: 'Test' },
    },
  });
});

it('entity list on query', () => {
  expectCacheIntegrity({
    query: gql`
      {
        __typename
        items {
          __typename
          id
        }
      }
    `,
    data: {
      __typename: 'Query',
      items: [
        { __typename: 'Item', id: 1 },
        { __typename: 'Item', id: 2 },
      ],
    },
  });
});

it('nested entity list on query', () => {
  expectCacheIntegrity({
    query: gql`
      {
        __typename
        items {
          __typename
          id
        }
      }
    `,
    data: {
      // This is the same as above, but with a nested array and added null values
      __typename: 'Query',
      items: [
        { __typename: 'Item', id: 1 },
        [{ __typename: 'Item', id: 2 }, null],
        null,
      ],
    },
  });
});

it('entity list on query and inline fragment', () => {
  expectCacheIntegrity({
    query: gql`
      {
        __typename
        items {
          __typename
          id
        }
        ... on Query {
          items {
            test
          }
        }
      }
    `,
    data: {
      __typename: 'Query',
      items: [{ __typename: 'Item', id: 1, test: true }, null],
    },
  });
});

it('conditionless inline fragment', () => {
  expectCacheIntegrity({
    query: gql`
      {
        __typename
        ... {
          test
        }
      }
    `,
    data: {
      __typename: 'Query',
      test: true,
    },
  });
});

it('skipped conditionless inline fragment', () => {
  expectCacheIntegrity({
    query: gql`
      {
        __typename
        ... @skip(if: true) {
          test
        }
      }
    `,
    data: {
      __typename: 'Query',
    },
  });
});

it('entity list on query and spread fragment', () => {
  expectCacheIntegrity({
    query: gql`
      query Test {
        __typename
        items {
          __typename
          id
        }
        ...TestFragment
      }

      fragment TestFragment on Query {
        items {
          test
        }
      }
    `,
    data: {
      __typename: 'Query',
      items: [{ __typename: 'Item', id: 1, test: true }, null],
    },
  });
});

it('skipped spread fragment', () => {
  expectCacheIntegrity({
    query: gql`
      query Test {
        __typename
        ...TestFragment @skip(if: true)
      }

      fragment TestFragment on Query {
        test
      }
    `,
    data: {
      __typename: 'Query',
    },
  });
});

it('embedded objects on entities', () => {
  expectCacheIntegrity({
    query: gql`
      {
        __typename
        user {
          __typename
          id
          posts {
            __typename
            edges {
              __typename
              node {
                __typename
                id
              }
            }
          }
        }
      }
    `,
    data: {
      __typename: 'Query',
      user: {
        __typename: 'User',
        id: 1,
        posts: {
          __typename: 'PostsConnection',
          edges: [
            {
              __typename: 'PostsEdge',
              node: {
                __typename: 'Post',
                id: 1,
              },
            },
          ],
        },
      },
    },
  });
});

it('nested viewer selections', () => {
  expectCacheIntegrity({
    query: gql`
      {
        __typename
        int
        viewer {
          __typename
          int
        }
      }
    `,
    data: {
      __typename: 'Query',
      int: 42,
      viewer: {
        __typename: 'Query',
        int: 42,
      },
    },
  });
});

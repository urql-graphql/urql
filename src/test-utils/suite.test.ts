import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';
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
  expect(queryRes.data).toEqual(testcase.data);
  expect(queryRes.completeness).toBe('FULL');
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

it('invalid entity on query', () => {
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
    // This entity comes back with an invalid typename (for some reason or another)
    data: {
      __typename: 'Query',
      item: { __typename: null, id: '123', name: 'Test' },
    },
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
      items: [{ __typename: 'Item', id: 1 }, { __typename: 'Item', id: 2 }],
    },
  });
});

it('nested entity list on query', () => {
  expectCacheIntegrity({
    query: gql`
      {
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

it('embedded object on entity', () => {
  expectCacheIntegrity({
    query: gql`
      {
        __typename
        item {
          __typename
          id
          author {
            __typename
            name
          }
        }
      }
    `,
    data: {
      __typename: 'Query',
      item: {
        __typename: 'Item',
        id: 1,
        author: {
          __typename: 'Author',
          name: 'Stanley',
        },
      },
    },
  });
});

it('embedded object on entity', () => {
  expectCacheIntegrity({
    query: gql`
      {
        __typename
        item {
          __typename
          id
          author {
            __typename
            id
            name
          }
        }
      }
    `,
    data: {
      __typename: 'Query',
      item: {
        __typename: 'Item',
        id: 1,
        author: {
          __typename: 'Author',
          id: 1,
          name: 'Stanley',
        },
      },
    },
  });
});

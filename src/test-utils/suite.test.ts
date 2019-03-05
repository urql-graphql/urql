import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';
import { query, write } from '../operations';
import { create, serialize } from '../store';

interface TestCase {
  query: DocumentNode;
  variables?: any;
  data: any;
}

const expectCacheIntegrity = (testcase: TestCase) => {
  const store = create();
  const request = { query: testcase.query, variables: testcase.variables };
  const writeRes = write(store, request, testcase.data);
  const queryRes = query(store, request);
  expect(queryRes.data).toEqual(testcase.data);
  expect(queryRes.isComplete).toBe(true);
  expect(queryRes.dependencies).toEqual(writeRes.dependencies);
  const json = serialize(store);
  expect(json).toMatchSnapshot();
  expect(queryRes.dependencies).toMatchSnapshot();
  return json;
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
  const store = expectCacheIntegrity({
    query: gql`
      {
        __typename
        int(test: true)
      }
    `,
    data: { __typename: 'Query', int: 42 },
  });

  expect(store.records.query).toMatchObject({
    __typename: 'Query',
    'int({"test":true})': 42,
  });
});

it('non-keyable entity on query', () => {
  const store = expectCacheIntegrity({
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

  expect(store.links['query.item']).toBe('query.item');
  expect(store.records['query.item']).toMatchObject({
    __typename: 'Item',
    name: 'Test',
  });
});

it('invalid entity on query', () => {
  const store = expectCacheIntegrity({
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

  expect(store.links['query.item']).toBe(undefined);
  expect(store.records['query.item']).toBe(undefined);
  expect(store.records.query).toMatchObject({
    __typename: 'Query',
    item: { __typename: null, id: '123', name: 'Test' },
  });
});

it('non-IDable entity on query', () => {
  const store = expectCacheIntegrity({
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

  expect(store.links['query.item']).toBe('query.item');
  expect(store.records['query.item']).toMatchObject({
    __typename: 'Item',
    name: 'Test',
  });
});

it('entity on query', () => {
  const store = expectCacheIntegrity({
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

  expect(store.links['query.item']).toBe('Item:1');
  expect(store.records['Item:1']).toMatchObject({
    __typename: 'Item',
    id: '1',
    name: 'Test',
  });
});

it('entity with arguments on query', () => {
  const store = expectCacheIntegrity({
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

  expect(store.links['query.item({"test":true})']).toBe('Item:1');
  expect(store.records.query).toMatchObject({ 'item({"test":true})': null });
});

it('entity with Int-like ID on query', () => {
  const store = expectCacheIntegrity({
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

  expect(store.links['query.item']).toBe('Item:1');
  expect(store.links['query.item']).toBe('Item:1');
  expect(store.records.query.item).toBe(null);

  expect(store.records['Item:1']).toMatchObject({
    __typename: 'Item',
    id: 1,
    name: 'Test',
  });
});

it('entity list on query', () => {
  const store = expectCacheIntegrity({
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

  expect(store.links['query.items']).toEqual(['Item:1', 'Item:2']);
  expect(store.records.query.items).toBe(null);

  expect(store.records['Item:1']).toMatchObject({
    __typename: 'Item',
    id: 1,
  });

  expect(store.records['Item:2']).toMatchObject({
    __typename: 'Item',
    id: 2,
  });
});

it('nested entity list on query', () => {
  const store = expectCacheIntegrity({
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
      items: [
        { __typename: 'Item', id: 1 },
        [{ __typename: 'Item', id: 2 }, null],
        null,
      ],
    },
  });

  expect(store.links['query.items']).toEqual([
    'Item:1',
    ['Item:2', null],
    null,
  ]);
  expect(store.records.query.items).toBe(null);

  expect(store.records['Item:1']).toMatchObject({
    __typename: 'Item',
    id: 1,
  });

  expect(store.records['Item:2']).toMatchObject({
    __typename: 'Item',
    id: 2,
  });
});

it('entity list on query and inline fragment', () => {
  const store = expectCacheIntegrity({
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

  expect(store.links['query.items']).toEqual(['Item:1', null]);

  expect(store.records.query.__typename).toBe('Query');
  expect(store.records.query.items).toBe(null);

  expect(store.records['Item:1']).toMatchObject({
    __typename: 'Item',
    id: 1,
    test: true,
  });
});

it('entity list on query and spread fragment', () => {
  const store = expectCacheIntegrity({
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

  expect(store.links['query.items']).toEqual(['Item:1', null]);

  expect(store.records.query.__typename).toBe('Query');
  expect(store.records.query.items).toBe(null);

  expect(store.records['Item:1']).toMatchObject({
    __typename: 'Item',
    id: 1,
    test: true,
  });
});

it('embedded object on entity', () => {
  const store = expectCacheIntegrity({
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

  expect(store.links['query.item']).toBe('Item:1');
  expect(store.links['Item:1.author']).toBe('Item:1.author');

  expect(store.records.query.item).toBe(null);
  expect(store.records['Item:1']).toMatchObject({
    __typename: 'Item',
    id: 1,
    author: null,
  });

  expect(store.records['Item:1.author']).toMatchObject({
    __typename: 'Author',
    name: 'Stanley',
  });
});

it('embedded object on entity', () => {
  const store = expectCacheIntegrity({
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

  expect(store.links['query.item']).toBe('Item:1');
  expect(store.links['Item:1.author']).toBe('Author:1');

  expect(store.records.query.item).toBe(null);
  expect(store.records['Item:1']).toMatchObject({
    __typename: 'Item',
    id: 1,
    author: null,
  });

  expect(store.records['Author:1']).toMatchObject({
    __typename: 'Author',
    id: 1,
    name: 'Stanley',
  });
});

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
        int
      }
    `,
    data: { int: 42 },
  });
});

it('json on query', () => {
  expectCacheIntegrity({
    query: gql`
      {
        json
      }
    `,
    // The `__typename` field should not mislead the cache
    data: { json: { __typename: 'Misleading', test: true } },
  });
});

it('nullable field on query', () => {
  expectCacheIntegrity({
    query: gql`
      {
        missing
      }
    `,
    data: { missing: null },
  });
});

it('int field with arguments on query', () => {
  const store = expectCacheIntegrity({
    query: gql`
      {
        int(test: true)
      }
    `,
    data: { int: 42 },
  });

  expect(store.records.query).toMatchObject({
    'int({"test":true})': 42,
  });
});

it('non-keyable entity on query', () => {
  const store = expectCacheIntegrity({
    query: gql`
      {
        item {
          name
        }
      }
    `,
    // This entity has no `__typename` field
    data: { item: { name: 'Test' } },
  });

  expect(store.links['query.item']).toBe('query.item');
  expect(store.records['query.item']).toMatchObject({ name: 'Test' });
});

it('non-IDable entity on query', () => {
  const store = expectCacheIntegrity({
    query: gql`
      {
        item {
          __typename
          name
        }
      }
    `,
    // This entity has a `__typename` but no ID fields
    data: { item: { __typename: 'Item', name: 'Test' } },
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
        item {
          __typename
          id
          name
        }
      }
    `,
    data: { item: { __typename: 'Item', id: '1', name: 'Test' } },
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
        item(test: true) {
          __typename
          id
          name
        }
      }
    `,
    data: { item: { __typename: 'Item', id: '1', name: 'Test' } },
  });

  expect(store.links['query.item({"test":true})']).toBe('Item:1');
  expect(store.records.query).toMatchObject({ 'item({"test":true})': null });
});

it('entity with Int-like ID on query', () => {
  const store = expectCacheIntegrity({
    query: gql`
      {
        item {
          __typename
          id
          name
        }
      }
    `,
    // This is the same as above, but with a number on `id`
    data: { item: { __typename: 'Item', id: 1, name: 'Test' } },
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
        items {
          __typename
          id
        }
      }
    `,
    data: {
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

it('embedded object on entity', () => {
  const store = expectCacheIntegrity({
    query: gql`
      {
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

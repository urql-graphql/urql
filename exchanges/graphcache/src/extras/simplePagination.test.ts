import { gql } from '@urql/core';
import { query, write } from '../operations';
import { Store } from '../store';
import { simplePagination } from './simplePagination';

it('works with forward pagination', () => {
  const Pagination = gql`
    query($skip: Number, $limit: Number) {
      __typename
      persons(skip: $skip, limit: $limit) {
        __typename
        id
        name
      }
    }
  `;

  const store = new Store({
    resolvers: {
      Query: {
        persons: simplePagination(),
      },
    },
  });

  const pageOne = {
    __typename: 'Query',
    persons: [
      { id: 1, name: 'Jovi', __typename: 'Person' },
      { id: 2, name: 'Phil', __typename: 'Person' },
      { id: 3, name: 'Andy', __typename: 'Person' },
    ],
  };

  const pageTwo = {
    __typename: 'Query',
    persons: [
      { id: 4, name: 'Kadi', __typename: 'Person' },
      { id: 5, name: 'Dom', __typename: 'Person' },
      { id: 6, name: 'Sofia', __typename: 'Person' },
    ],
  };

  write(
    store,
    { query: Pagination, variables: { skip: 0, limit: 3 } },
    pageOne
  );
  const pageOneResult = query(store, {
    query: Pagination,
    variables: { skip: 0, limit: 3 },
  });
  expect(pageOneResult.data).toEqual(pageOne);

  write(
    store,
    { query: Pagination, variables: { skip: 3, limit: 3 } },
    pageTwo
  );

  const pageTwoResult = query(store, {
    query: Pagination,
    variables: { skip: 3, limit: 3 },
  });
  expect((pageTwoResult.data as any).persons).toEqual([
    ...pageOne.persons,
    ...pageTwo.persons,
  ]);

  const pageThreeResult = query(store, {
    query: Pagination,
    variables: { skip: 6, limit: 3 },
  });
  expect(pageThreeResult.data).toEqual(null);
});

it('works with backwards pagination', () => {
  const Pagination = gql`
    query($skip: Number, $limit: Number) {
      __typename
      persons(skip: $skip, limit: $limit) {
        __typename
        id
        name
      }
    }
  `;

  const store = new Store({
    resolvers: {
      Query: {
        persons: simplePagination({ mergeMode: 'before' }),
      },
    },
  });

  const pageOne = {
    __typename: 'Query',
    persons: [
      { id: 7, name: 'Jovi', __typename: 'Person' },
      { id: 8, name: 'Phil', __typename: 'Person' },
      { id: 9, name: 'Andy', __typename: 'Person' },
    ],
  };

  const pageTwo = {
    __typename: 'Query',
    persons: [
      { id: 4, name: 'Kadi', __typename: 'Person' },
      { id: 5, name: 'Dom', __typename: 'Person' },
      { id: 6, name: 'Sofia', __typename: 'Person' },
    ],
  };

  write(
    store,
    { query: Pagination, variables: { skip: 0, limit: 3 } },
    pageOne
  );
  const pageOneResult = query(store, {
    query: Pagination,
    variables: { skip: 0, limit: 3 },
  });
  expect(pageOneResult.data).toEqual(pageOne);

  write(
    store,
    { query: Pagination, variables: { skip: 3, limit: 3 } },
    pageTwo
  );

  const pageTwoResult = query(store, {
    query: Pagination,
    variables: { skip: 3, limit: 3 },
  });
  expect((pageTwoResult.data as any).persons).toEqual([
    ...pageTwo.persons,
    ...pageOne.persons,
  ]);

  const pageThreeResult = query(store, {
    query: Pagination,
    variables: { skip: 6, limit: 3 },
  });
  expect(pageThreeResult.data).toEqual(null);
});

it('handles duplicates', () => {
  const Pagination = gql`
    query($skip: Number, $limit: Number) {
      __typename
      persons(skip: $skip, limit: $limit) {
        __typename
        id
        name
      }
    }
  `;

  const store = new Store({
    resolvers: {
      Query: {
        persons: simplePagination(),
      },
    },
  });

  const pageOne = {
    __typename: 'Query',
    persons: [
      { id: 1, name: 'Jovi', __typename: 'Person' },
      { id: 2, name: 'Phil', __typename: 'Person' },
      { id: 3, name: 'Andy', __typename: 'Person' },
    ],
  };

  const pageTwo = {
    __typename: 'Query',
    persons: [
      { id: 3, name: 'Andy', __typename: 'Person' },
      { id: 4, name: 'Kadi', __typename: 'Person' },
      { id: 5, name: 'Dom', __typename: 'Person' },
    ],
  };

  write(
    store,
    { query: Pagination, variables: { skip: 0, limit: 3 } },
    pageOne
  );
  write(
    store,
    { query: Pagination, variables: { skip: 2, limit: 3 } },
    pageTwo
  );

  const result = query(store, {
    query: Pagination,
    variables: { skip: 2, limit: 3 },
  });
  expect(result.data).toEqual({
    __typename: 'Query',
    persons: [...pageOne.persons, pageTwo.persons[1], pageTwo.persons[2]],
  });
});

it('should not return previous result when adding a parameter', () => {
  const Pagination = gql`
    query($skip: Number, $limit: Number, $filter: String) {
      __typename
      persons(skip: $skip, limit: $limit, filter: $filter) {
        __typename
        id
        name
      }
    }
  `;

  const store = new Store({
    resolvers: {
      Query: {
        persons: simplePagination(),
      },
    },
  });

  const pageOne = {
    __typename: 'Query',
    persons: [
      { id: 1, name: 'Jovi', __typename: 'Person' },
      { id: 2, name: 'Phil', __typename: 'Person' },
      { id: 3, name: 'Andy', __typename: 'Person' },
    ],
  };

  const emptyPage = {
    __typename: 'Query',
    persons: [],
  };

  write(
    store,
    { query: Pagination, variables: { skip: 0, limit: 3 } },
    pageOne
  );
  write(
    store,
    { query: Pagination, variables: { skip: 0, limit: 3, filter: 'b' } },
    emptyPage
  );

  const res = query(store, {
    query: Pagination,
    variables: { skip: 0, limit: 3, filter: 'b' },
  });
  expect(res.data).toEqual({ __typename: 'Query', persons: [] });
});

it('should preserve the correct order in forward pagination', () => {
  const Pagination = gql`
    query($skip: Number, $limit: Number) {
      __typename
      persons(skip: $skip, limit: $limit) {
        __typename
        id
        name
      }
    }
  `;

  const store = new Store({
    resolvers: {
      Query: {
        persons: simplePagination({ mergeMode: 'after' }),
      },
    },
  });

  const pageOne = {
    __typename: 'Query',
    persons: [
      { id: 1, name: 'Jovi', __typename: 'Person' },
      { id: 2, name: 'Phil', __typename: 'Person' },
      { id: 3, name: 'Andy', __typename: 'Person' },
    ],
  };

  const pageTwo = {
    __typename: 'Query',
    persons: [
      { id: 4, name: 'Kadi', __typename: 'Person' },
      { id: 5, name: 'Dom', __typename: 'Person' },
      { id: 6, name: 'Sofia', __typename: 'Person' },
    ],
  };

  write(
    store,
    { query: Pagination, variables: { skip: 3, limit: 3 } },
    pageTwo
  );
  write(
    store,
    { query: Pagination, variables: { skip: 0, limit: 3 } },
    pageOne
  );

  const result = query(store, {
    query: Pagination,
    variables: { skip: 3, limit: 3 },
  });
  expect(result.data).toEqual({
    __typename: 'Query',
    persons: [...pageOne.persons, ...pageTwo.persons],
  });
});

it('should preserve the correct order in backward pagination', () => {
  const Pagination = gql`
    query($skip: Number, $limit: Number) {
      __typename
      persons(skip: $skip, limit: $limit) {
        __typename
        id
        name
      }
    }
  `;

  const store = new Store({
    resolvers: {
      Query: {
        persons: simplePagination({ mergeMode: 'before' }),
      },
    },
  });

  const pageOne = {
    __typename: 'Query',
    persons: [
      { id: 7, name: 'Jovi', __typename: 'Person' },
      { id: 8, name: 'Phil', __typename: 'Person' },
      { id: 9, name: 'Andy', __typename: 'Person' },
    ],
  };

  const pageTwo = {
    __typename: 'Query',
    persons: [
      { id: 4, name: 'Kadi', __typename: 'Person' },
      { id: 5, name: 'Dom', __typename: 'Person' },
      { id: 6, name: 'Sofia', __typename: 'Person' },
    ],
  };

  write(
    store,
    { query: Pagination, variables: { skip: 3, limit: 3 } },
    pageTwo
  );
  write(
    store,
    { query: Pagination, variables: { skip: 0, limit: 3 } },
    pageOne
  );

  const result = query(store, {
    query: Pagination,
    variables: { skip: 3, limit: 3 },
  });

  expect(result.data).toEqual({
    __typename: 'Query',
    persons: [...pageTwo.persons, ...pageOne.persons],
  });
});

it('prevents overlapping of pagination on different arguments', () => {
  const Pagination = gql`
    query($skip: Number, $limit: Number, $filter: string) {
      __typename
      persons(skip: $skip, limit: $limit, filter: $filter) {
        __typename
        id
        name
      }
    }
  `;

  const store = new Store({
    resolvers: {
      Query: {
        persons: simplePagination(),
      },
    },
  });

  const page = withId => ({
    __typename: 'Query',
    persons: [{ id: withId, name: withId, __typename: 'Person' }],
  });

  write(
    store,
    { query: Pagination, variables: { filter: 'one', skip: 0, limit: 1 } },
    page('one')
  );

  write(
    store,
    { query: Pagination, variables: { filter: 'two', skip: 1, limit: 1 } },
    page('two')
  );

  const resOne = query(store, {
    query: Pagination,
    variables: { filter: 'one', skip: 0, limit: 1 },
  });
  const resTwo = query(store, {
    query: Pagination,
    variables: { filter: 'two', skip: 1, limit: 1 },
  });
  const resThree = query(store, {
    query: Pagination,
    variables: { filter: 'three', skip: 2, limit: 1 },
  });

  expect(resOne.data).toHaveProperty(['persons', 0, 'id'], 'one');
  expect(resOne.data).toHaveProperty('persons.length', 1);

  expect(resTwo.data).toHaveProperty(['persons', 0, 'id'], 'two');
  expect(resTwo.data).toHaveProperty('persons.length', 1);

  expect(resThree.data).toEqual(null);
});

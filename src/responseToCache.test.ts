import gql from 'graphql-tag';

import { createCache } from './cacheUtils';
import responseToCache from './responseToCache';
import { Cache } from './types';

let cache: Cache;

beforeEach(() => {
  cache = createCache();
});

it('caches flat scalars', () => {
  const query = gql`
    {
      __typename
      test
    }
  `;

  const response = {
    __typename: 'Query',
    test: 'value',
  };

  responseToCache(cache, { query }, response);

  expect(cache).toEqual({
    records: {
      Query: response,
    },
    links: {},
  });
});

it('caches embedded objects', () => {
  const query = gql`
    {
      __typename
      test {
        __typename
        value
      }
    }
  `;

  const response = {
    __typename: 'Query',
    test: { __typename: null, value: '123' },
  };

  responseToCache(cache, { query }, response);

  expect(cache).toEqual({
    records: {
      Query: response,
    },
    links: {},
  });
});

it('caches flat entities', () => {
  const query = gql`
    {
      __typename
      test {
        __typename
        id
      }
    }
  `;

  const response = {
    __typename: 'Query',
    test: {
      __typename: 'Test',
      id: 'test',
    },
  };

  responseToCache(cache, { query }, response);

  expect(cache).toEqual({
    records: {
      Query: { __typename: 'Query' },
      'Test:test': response.test,
    },
    links: {
      'Query->test': 'Test:test',
    },
  });
});

it('caches entity lists', () => {
  const query = gql`
    {
      __typename
      test {
        __typename
        id
      }
    }
  `;

  const response = {
    __typename: 'Query',
    test: [
      {
        __typename: 'Test',
        id: 'test',
      },
      null,
    ],
  };

  responseToCache(cache, { query }, response);

  expect(cache).toEqual({
    records: {
      Query: { __typename: 'Query' },
      'Test:test': response.test[0],
    },
    links: {
      'Query->test': ['Test:test', null],
    },
  });
});

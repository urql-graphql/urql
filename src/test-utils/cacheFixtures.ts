import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';
import { CacheData } from '../cache';
import { Entity } from '../types';

export interface CacheTestCase {
  it: string;
  doc: DocumentNode;
  cache: CacheData;
  response: Entity;
}

export const cases: CacheTestCase[] = [
  {
    it: 'flat scalars',
    doc: gql`
      {
        __typename
        test
      }
    `,
    cache: {
      records: {
        Query: {
          __typename: 'Query',
          test: 'value',
        },
      },
      links: {},
    },
    response: {
      __typename: 'Query',
      test: 'value',
    },
  },
  {
    it: 'embedded objects',
    doc: gql`
      {
        __typename
        test {
          __typename
          value
        }
      }
    `,
    cache: {
      records: {
        Query: {
          __typename: 'Query',
          test: { value: '123' },
        },
      },
      links: {},
    },
    response: {
      __typename: 'Query',
      test: { value: '123' },
    },
  },
  {
    it: 'flat entities',
    doc: gql`
      {
        __typename
        test {
          __typename
          id
        }
      }
    `,
    cache: {
      records: {
        Query: { __typename: 'Query' },
        'Test:test': {
          __typename: 'Test',
          id: 'test',
        },
      },
      links: {
        'Query->test': 'Test:test',
      },
    },
    response: {
      __typename: 'Query',
      test: {
        __typename: 'Test',
        id: 'test',
      },
    },
  },
  {
    it: 'entity lists',
    doc: gql`
      {
        __typename
        test {
          __typename
          id
        }
      }
    `,
    cache: {
      records: {
        Query: { __typename: 'Query' },
        'Test:test': {
          __typename: 'Test',
          id: 'test',
        },
      },
      links: {
        'Query->test': ['Test:test', null],
      },
    },
    response: {
      __typename: 'Query',
      test: [
        {
          __typename: 'Test',
          id: 'test',
        },
        null,
      ],
    },
  },
  {
    it: 'entity lists with arguments and aliases',
    doc: gql`
      {
        __typename
        first: todos(first: 2) {
          __typename
          id
        }
        last: todos(last: 1) {
          __typename
          id
        }
      }
    `,
    cache: {
      records: {
        Query: { __typename: 'Query' },
        'Todo:1': {
          __typename: 'Todo',
          id: '1',
        },
        'Todo:2': {
          __typename: 'Todo',
          id: '2',
        },
        'Todo:99': {
          __typename: 'Todo',
          id: '99',
        },
      },
      links: {
        'Query->todos({"first":2})': ['Todo:1', 'Todo:2'],
        'Query->todos({"last":1})': ['Todo:99'],
      },
    },
    response: {
      __typename: 'Query',
      first: [
        {
          __typename: 'Todo',
          id: '1',
        },
        {
          __typename: 'Todo',
          id: '2',
        },
      ],
      last: [
        {
          __typename: 'Todo',
          id: '99',
        },
      ],
    },
  },
];

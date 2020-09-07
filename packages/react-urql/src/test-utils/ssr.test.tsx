import React from 'react';
import gql from 'graphql-tag';
import prepass from 'react-ssr-prepass';
import { never, publish, filter, delay, pipe, map } from 'wonka';

import {
  createClient,
  Exchange,
  dedupExchange,
  cacheExchange,
  ssrExchange,
  OperationContext,
  GraphQLRequest,
  Operation,
  OperationResult,
} from '@urql/core';

import { Provider } from '../context';
import { useQuery } from '../hooks';

const context: OperationContext = {
  fetchOptions: {
    method: 'POST',
  },
  requestPolicy: 'cache-first',
  url: 'http://localhost:3000/graphql',
};

export const queryGql: GraphQLRequest = {
  key: 2,
  query: gql`
    query getUser($name: String) {
      user(name: $name) {
        id
        firstName
        lastName
      }
    }
  `,
  variables: {
    name: 'Clara',
  },
};

const teardownOperation: Operation = {
  query: queryGql.query,
  variables: queryGql.variables,
  key: queryGql.key,
  operationName: 'teardown',
  context,
};

const queryOperation: Operation = {
  query: teardownOperation.query,
  variables: teardownOperation.variables,
  key: teardownOperation.key,
  operationName: 'query',
  context,
};

const queryResponse: OperationResult = {
  operation: queryOperation,
  data: {
    user: {
      name: 'Clive',
    },
  },
};

const url = 'https://hostname.com';

describe('server-side rendering', () => {
  let ssr;
  let client;

  beforeEach(() => {
    const fetchExchange: Exchange = () => ops$ => {
      return pipe(
        ops$,
        filter(x => x.operationName === 'query'),
        delay(100),
        map(operation => ({ ...queryResponse, operation }))
      );
    };

    ssr = ssrExchange();
    client = createClient({
      url,
      // We include the SSR exchange after the cache
      exchanges: [dedupExchange, cacheExchange, ssr, fetchExchange],
      suspense: true,
    });
  });

  it('correctly executes suspense and populates the SSR cache', async () => {
    let promise;

    try {
      pipe(client.executeRequestOperation(queryOperation), publish);
    } catch (error) {
      promise = error;
    }

    expect(promise).toBeInstanceOf(Promise);
    const result = await promise;
    expect(result.data).not.toBe(undefined);

    const data = ssr.extractData();
    expect(Object.keys(data).length).toBe(1);
  });

  it('works for an actual component tree', async () => {
    const Query = () => {
      useQuery({
        query: queryOperation.query,
        variables: queryOperation.variables,
      });

      return null;
    };

    const App = () => (
      <Provider value={client}>
        <Query />
      </Provider>
    );

    await prepass(<App />);

    const data = ssr.extractData();
    expect(Object.keys(data).length).toBe(1);
  });
});

describe('client-side rehydration', () => {
  let ssr;
  let client;

  beforeEach(() => {
    const fetchExchange: Exchange = () => () => never as any;

    ssr = ssrExchange();
    client = createClient({
      url,
      // We include the SSR exchange after the cache
      exchanges: [dedupExchange, cacheExchange, ssr, fetchExchange],
      suspense: false,
    });
  });

  it('can rehydrate results on the client', async () => {
    ssr.restoreData({
      [queryOperation.key]: {
        ...queryResponse,
        data: JSON.stringify(queryResponse.data),
      },
    });

    expect(() => {
      pipe(client.executeRequestOperation(queryOperation), publish);
    }).not.toThrow();

    await Promise.resolve();

    const data = ssr.extractData();
    expect(Object.keys(data).length).toBe(0);
  });
});

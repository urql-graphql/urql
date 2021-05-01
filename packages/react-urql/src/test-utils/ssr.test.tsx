import React from 'react';
import prepass from 'react-ssr-prepass';
import { never, publish, filter, delay, pipe, map } from 'wonka';

import {
  gql,
  Client,
  Exchange,
  dedupExchange,
  cacheExchange,
  ssrExchange,
  OperationContext,
  GraphQLRequest,
  Operation,
  OperationResult,
  makeOperation,
} from '@urql/core';

import { Provider } from '../context';
import { useQuery } from '../hooks';

const context: OperationContext = {
  fetchOptions: {
    method: 'POST',
  },
  requestPolicy: 'cache-first',
  url: 'http://localhost:3000/graphql',
  suspense: true,
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

const teardownOperation: Operation = makeOperation(
  'teardown',
  {
    query: queryGql.query,
    variables: queryGql.variables,
    key: queryGql.key,
  },
  context
);

const queryOperation: Operation = makeOperation(
  'query',
  {
    query: teardownOperation.query,
    variables: teardownOperation.variables,
    key: teardownOperation.key,
  },
  context
);

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
  let client: Client;

  beforeEach(() => {
    const fetchExchange: Exchange = () => ops$ => {
      return pipe(
        ops$,
        filter(x => x.kind === 'query'),
        delay(100),
        map(operation => ({ ...queryResponse, operation }))
      );
    };

    ssr = ssrExchange();
    client = new Client({
      url,
      // We include the SSR exchange after the cache
      exchanges: [dedupExchange, cacheExchange, ssr, fetchExchange],
      suspense: true,
    });
  });

  it('works for an actual component tree', async () => {
    const Query = () => {
      useQuery({
        query: queryOperation.query,
        variables: queryOperation.variables,
      });

      return null;
    };

    const Element = Provider as any;
    const App = () => (
      <Element value={client}>
        <Query />
      </Element>
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
    client = new Client({
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

import React from 'react';
import prepass from 'react-ssr-prepass';
import { never, publish, filter, delay, pipe, map } from 'wonka';

import { createClient } from '../client';
import { Provider } from '../context';
import { useQuery } from '../hooks';
import { dedupExchange, cacheExchange, ssrExchange } from '../exchanges';
import { Exchange } from '../types';
import { queryOperation, queryResponse } from './index';

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
      pipe(
        client.executeRequestOperation(queryOperation),
        publish
      );
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

  it('can rehydrate results on the client', () => {
    ssr.restoreData({ [queryOperation.key]: queryResponse });

    expect(() => {
      pipe(
        client.executeRequestOperation(queryOperation),
        publish
      );
    }).not.toThrow();

    const data = ssr.extractData();
    expect(Object.keys(data).length).toBe(0);
  });
});

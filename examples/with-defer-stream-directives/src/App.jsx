import React from 'react';
import {
  createClient,
  Provider,
  dedupExchange,
  debugExchange,
  fetchExchange,
} from 'urql';

import { cacheExchange } from '@urql/exchange-graphcache';

import Songs from './Songs';

const cache = cacheExchange({
  keys: {
    Alphabet: data => data.char,
    Song: () => null,
  },
});

const client = createClient({
  url: 'http://localhost:3004/graphql',
  exchanges: [dedupExchange, cache, debugExchange, fetchExchange],
});

function App() {
  return (
    <Provider value={client}>
      <Songs />
    </Provider>
  );
}

export default App;

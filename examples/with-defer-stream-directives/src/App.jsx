import React from 'react';
import { Client, Provider, fetchExchange } from 'urql';

import { cacheExchange } from '@urql/exchange-graphcache';

import Songs from './Songs';

const cache = cacheExchange({
  keys: {
    Alphabet: data => data.char,
    Song: () => null,
  },
});

const client = new Client({
  suspense: true,
  url: 'http://localhost:3004/graphql',
  exchanges: [cache, fetchExchange],
});

function App() {
  return (
    <Provider value={client}>
      <React.Suspense fallback={<p>Loading...</p>}>
        <Songs />
      </React.Suspense>
    </Provider>
  );
}

export default App;

import React from 'react';
import { Client, Provider, fetchExchange } from 'urql';

import { cacheExchange } from '@urql/exchange-graphcache';

import Songs from './Songs';

const cache = cacheExchange({
  keys: {
    Alphabet: data => data.char,
  },
  updates: {
    Subscription: {
      alphabet(parent, _args, cache) {
        const list = cache.resolve('Query', 'list') || [];
        list.push(parent.alphabet);
        cache.link('Query', 'list', list);
      },
    },
  },
});

const client = new Client({
  url: 'http://localhost:3004/graphql',
  fetchSubscriptions: true,
  exchanges: [cache, fetchExchange],
});

function App() {
  return (
    <Provider value={client}>
      <Songs />
    </Provider>
  );
}

export default App;

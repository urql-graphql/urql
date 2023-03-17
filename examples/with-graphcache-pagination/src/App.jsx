import React from 'react';
import { Client, Provider, fetchExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache';
import { relayPagination } from '@urql/exchange-graphcache/extras';

import PaginatedNpmSearch from './PaginatedNpmSearch';

const client = new Client({
  url: 'https://trygql.formidable.dev/graphql/relay-npm',
  exchanges: [
    cacheExchange({
      resolvers: {
        Query: {
          search: relayPagination(),
        },
      },
    }),
    fetchExchange,
  ],
});

function App() {
  return (
    <Provider value={client}>
      <PaginatedNpmSearch />
    </Provider>
  );
}

export default App;

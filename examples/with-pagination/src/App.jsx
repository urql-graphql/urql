import React from 'react';
import { Client, Provider, cacheExchange, fetchExchange } from 'urql';

import PaginatedNpmSearch from './PaginatedNpmSearch';

const client = new Client({
  url: 'https://trygql.formidable.dev/graphql/relay-npm',
  exchanges: [cacheExchange, fetchExchange],
});

function App() {
  return (
    <Provider value={client}>
      <PaginatedNpmSearch />
    </Provider>
  );
}

export default App;

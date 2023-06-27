import React from 'react';
import { Client, Provider, cacheExchange, fetchExchange } from 'urql';

import PokemonList from './PokemonList';

const client = new Client({
  url: 'https://trygql.formidable.dev/graphql/basic-pokedex',
  exchanges: [cacheExchange, fetchExchange],
  preferGetMethod: 'force',
  requestPolicy: 'network-only',
  fetchOptions: {
    headers: {
      'x-example': 'store-code',
    },
  },
});

function App() {
  return (
    <Provider value={client}>
      <PokemonList />
    </Provider>
  );
}

export default App;

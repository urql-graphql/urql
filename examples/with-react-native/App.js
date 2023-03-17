import React from 'react';
import { Client, Provider, cacheExchange, fetchExchange } from 'urql';

import PokemonList from './src/screens/PokemonList';

const client = new Client({
  url: 'https://trygql.formidable.dev/graphql/basic-pokedex',
  exchanges: [cacheExchange, fetchExchange],
});

const App = () => {
  return (
    <Provider value={client}>
      <PokemonList />
    </Provider>
  );
};

export default App;

import React from 'react';
import { createClient, Provider } from 'urql';

import PokemonList from './src/screens/PokemonList';

const client = createClient({
  url: 'https://trygql.formidable.dev/graphql/basic-pokedex',
});

const App = () => {
  return (
    <Provider value={client}>
      <PokemonList />
    </Provider>
  );
};

export default App;

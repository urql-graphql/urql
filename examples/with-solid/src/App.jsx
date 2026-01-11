import { createClient, Provider, cacheExchange, fetchExchange } from '@urql/solid';
import PokemonList from './PokemonList';

const client = createClient({
  url: 'https://trygql.formidable.dev/graphql/basic-pokedex',
  exchanges: [cacheExchange, fetchExchange],
});

function App() {
  return (
    <Provider value={client}>
      <PokemonList />
    </Provider>
  );
}

export default App;

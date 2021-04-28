import { createClient, Provider } from "urql";

import PokemonList from "./pages/PokemonList";

const client = createClient({
  url: "https://trygql.dev/graphql/basic-pokedex",
});

function App() {
  return (
    <Provider value={client}>
      <PokemonList />
    </Provider>
  );
}

export default App;

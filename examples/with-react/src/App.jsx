import React from "react";
import { createClient, Provider } from "urql";

import PokemonList from "./PokemonList";

const client = createClient({
  url: "https://trygql.formidable.dev/graphql/basic-pokedex",
});

function App() {
  return (
    <Provider value={client}>
      <PokemonList />
    </Provider>
  );
}

export default App;

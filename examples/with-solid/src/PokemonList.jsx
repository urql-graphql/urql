/** @jsxImportSource solid-js */
import { Suspense, For } from 'solid-js';
import { gql } from '@urql/core';
import { createQuery } from '@urql/solid';

const POKEMONS_QUERY = gql`
  query Pokemons {
    pokemons(limit: 10) {
      id
      name
    }
  }
`;

const PokemonList = () => {
  const [result] = createQuery({ query: POKEMONS_QUERY });

  return (
    <div>
      <h1>Pokemon List</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <ul>
          <For each={result.data?.pokemons}>
            {pokemon => <li>{pokemon.name}</li>}
          </For>
        </ul>
      </Suspense>
    </div>
  );
};

export default PokemonList;

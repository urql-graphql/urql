import React from 'react';
import { gql, useQuery } from 'urql';

const POKEMONS_QUERY = gql`
  query Pokemons {
    pokemons(limit: 10) {
      id
      name
    }
  }
`;

const PokemonList = () => {
  const [result] = useQuery({ query: POKEMONS_QUERY });

  const { data, fetching, error } = result;

  return (
    <div>
      {fetching && <p>Loading...</p>}

      {error && <p>Oh no... {error.message}</p>}

      {data && (
        <ul>
          {data.pokemons.map(pokemon => (
            <li key={pokemon.id}>{pokemon.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PokemonList;

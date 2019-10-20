import React from 'react';
import gql from 'graphql-tag';
import { useQuery } from 'urql';

const queryPokemon = gql`
  query pokemon {
    pokemons(first: 20) {
      id
      name
      types
      resistant
      weaknesses
      evolutions {
        name
      }
    }
  }
`;

const PokemonList = () => {
  const [result] = useQuery({ query: queryPokemon });

  if (result.fetching || !result.data) {
    return null;
  }

  if (result.error) {
    return null;
  }

  return (
    <ul>
      {result.data.pokemons.map(pokemon => (
        <li key={pokemon.id}>{pokemon.name}</li>
      ))}
    </ul>
  );
};

export default PokemonList;

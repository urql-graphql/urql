import React from 'react';
import gql from 'graphql-tag';
import { useQuery } from 'urql';

const queryPokemon = gql`
  query pokemon($first: Int!) {
    pokemons(first: $first) {
      id
      name
      types
      resistant
      weaknesses
      image
      evolutions {
        name
      }
    }
  }
`;

const PokemonList = () => {
  const [result] = useQuery({ query: queryPokemon, variables: { first: 20 } });

  if (result.fetching || !result.data) {
    return null;
  }

  if (result.error) {
    return null;
  }

  return (
    <>
      <div className="pokemon-list">
        {result.data.pokemons.map(pokemon => (
          <div key={pokemon.id}>
            <img src={pokemon.image} className="pokemon-image" />
            <div>
              <h3>{pokemon.name}</h3>
              <p>{pokemon.types.join(', ')}</p>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .pokemon-list {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-template-rows: repeat(5, 1fr);
          grid-gap: 1rem;
          padding: 1rem;
        }

        .pokemon-image {
          height: 15rem;
        }
      `}</style>
    </>
  );
};

export default PokemonList;

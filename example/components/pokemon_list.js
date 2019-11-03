import React from 'react';
import gql from 'graphql-tag';
import { useQuery } from 'urql';

const typesToIcon = new Map([
  ['Bug', '/types/Bug@2x.png'],
  ['Dark', '/types/Dark@2x.png'],
  ['Dragon', '/types/Dragon@2x.png'],
  ['Electric', '/types/Electric@2x.png'],
  ['Fairy', '/types/Fairy@2x.png'],
  ['Fighting', '/types/Fight@2x.png'],
  ['Fire', '/types/Fire@2x.png'],
  ['Ghost', '/types/Ghost@2x.png'],
  ['Grass', '/types/Grass@2x.png'],
  ['Ground', '/types/Ground@2x.png'],
  ['Ice', '/types/Ice@2x.png'],
  ['Normal', '/types/Normal@2x.png'],
  ['Poison', '/types/Poison@2x.png'],
  ['Psychic', '/types/Psychic@2x.png'],
  ['Rock', '/types/Rock@2x.png'],
  ['Steel', '/types/Steel@2x.png'],
  ['Water', '/types/Water@2x.png'],
]);

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
              <h2>{pokemon.name}</h2>
              <div className="pokemon-type-container">
                {pokemon.types.map(type => {
                  if (typesToIcon.get(type)) {
                    return (
                      <div className="pokemon-type-container__type">
                        <img
                          src={typesToIcon.get(type)}
                          className="pokemon-type-container__type-icon"
                        />
                        <span className="pokemon-type-container__type-text">
                          {type}
                        </span>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        * {
          font-family: monospace;
        }

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

        .pokemon-type-container,
        .pokemon-type-container__type {
          display: flex;
        }

        .pokemon-type-container__type {
          margin-right: 0.5rem;
        }

        .pokemon-type-container__type-text {
          background: #f1f8ff;
          color: #0366d6;
          padding: 0.5rem;
          border-radius: 0.5rem;
        }

        .pokemon-type-container__type-icon {
          height: 2rem;
        }
      `}</style>
    </>
  );
};

export default PokemonList;

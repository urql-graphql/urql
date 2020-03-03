import React from 'react';
import gql from 'graphql-tag';
import { useQuery } from 'urql';
import Link from 'next/link';

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

const queryPokémon = gql`
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

interface PokémonData {
  pokemons: Pokémon[];
}

interface PokémonVariables {
  first: number;
}

interface Pokémon {
  id: string;
  name: string;
  types: string[];
  resistant: string[];
  weaknesses: string[];
  image: string;
  evolutions: {
    name: string;
  };
}

const PokémonList: React.FC = () => {
  const [result] = useQuery<PokémonData, PokémonVariables>({
    query: queryPokémon,
    variables: { first: 20 },
  });

  if (result.fetching || !result.data) {
    return null;
  }

  if (result.error) {
    return null;
  }

  return (
    <>
      <div className="pokémon-list">
        {result.data.pokemons.map(pokémon => (
          <div key={pokémon.id}>
            <Link href="/[pokemon]" as={`/${pokémon.name}`}>
              <img src={pokémon.image} className="pokémon-image" />
            </Link>
            <div>
              <h2>{pokémon.name}</h2>
              <div className="pokémon-type-container">
                {pokémon.types
                  .filter(type => typesToIcon.has(type))
                  .map(type => (
                    <div className="pokémon-type-container__type" key={type}>
                      <img
                        src={typesToIcon.get(type)}
                        className="pokémon-type-container__type-icon"
                      />
                      <span className="pokémon-type-container__type-text">
                        {type}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        * {
          font-family: monospace;
        }

        .pokémon-list {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-template-rows: repeat(5, 1fr);
          grid-gap: 1rem;
          padding: 1rem;
        }

        .pokémon-image {
          height: 15rem;
        }

        .pokémon-type-container,
        .pokémon-type-container__type {
          display: flex;
        }

        .pokémon-type-container__type {
          margin-right: 0.5rem;
        }

        .pokémon-type-container__type-text {
          background: #f1f8ff;
          color: #0366d6;
          padding: 0.5rem;
          border-radius: 0.5rem;
        }

        .pokémon-type-container__type-icon {
          height: 2rem;
        }
      `}</style>
    </>
  );
};

export default PokémonList;

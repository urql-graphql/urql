import React from 'react';
import { View, Text } from 'react-native';
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
    <View>
      <Text>aa</Text>
    </View>
  );
};

export default PokemonList;

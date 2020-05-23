import React from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'urql';
import { withUrqlClient } from 'next-urql';
import fetch from 'isomorphic-unfetch';
import gql from 'graphql-tag';

const pokemonQuery = gql`
  query pokemon($name: String!) {
    pokemon(name: $name) {
      types
      name
      classification
      image
    }
  }
`;

interface Response {
  pokemon: {
    types: string[];
    name: string;
    classification: string;
    iamge: string;
  };
}

interface Variables {
  name: string;
}

const Pokemon = () => {
  const {
    query: { pokemon },
  } = useRouter();
  const [result] = useQuery<Response, Variables>({
    query: pokemonQuery,
    variables: { name: pokemon as string },
  });

  if (result.fetching || !result.data) {
    return null;
  }

  if (result.error) {
    return null;
  }

  return <h1>{result.data.pokemon.name}</h1>;
};

export default withUrqlClient(() => ({
  url: 'https://graphql-pokemon.now.sh',
  fetch,
}))(Pokemon);

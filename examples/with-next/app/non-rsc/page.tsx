'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useQuery, gql } from '@urql/next';

export default function Page() {
  return (
    <Suspense>
      <Pokemons />
    </Suspense>
  );
}

const PokemonsQuery = gql`
  query {
    pokemons(limit: 10) {
      id
      name
    }
  }
`;

function Pokemons() {
  const [result] = useQuery({ query: PokemonsQuery });
  return (
    <main>
      <h1>This is rendered as part of SSR</h1>
      <ul>
        {result.data.pokemons.map((x: any) => (
          <li key={x.id}>{x.name}</li>
        ))}
      </ul>
      <Suspense>
        <Pokemon id="001" />
      </Suspense>
      <Link href="/">RSC</Link>
    </main>
  );
}

const PokemonQuery = gql`
  query ($id: ID!) {
    pokemon(id: $id) {
      id
      name
    }
  }
`;

function Pokemon(props: any) {
  const [result] = useQuery({
    query: PokemonQuery,
    variables: { id: props.id },
  });
  return (
    <div>
      <h1>{result.data && result.data.pokemon.name}</h1>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useQuery, gql } from '@urql/next';
import { useFragment } from 'urql';

export default function Page() {
  return (
    <Suspense>
      <Pokemons />
    </Suspense>
  );
}

const PokemonQuery = gql`
  fragment SiteFields on Launch {
    site {
      name
    }
  }
`;

const PokemonsQuery = gql`
  query {
    launches(limit: 10) {
      nodes {
        id
        name
        ...SiteFields @defer
      }
    }
  }

  ${PokemonQuery}
`;

function Pokemons() {
  const [result] = useQuery({ query: PokemonsQuery });
  return (
    <main>
      <h1>This is rendered as part of SSR</h1>
      <ul>
        {result.data
          ? result.data.launches.nodes.map((x: any) => (
              <li key={x.id}>
                {x.name}
                <Suspense>
                  <Site data={x} />
                </Suspense>
              </li>
            ))
          : JSON.stringify(result.error)}
      </ul>
      <Link href="/">RSC</Link>
    </main>
  );
}

function Site(props: any) {
  const result = useFragment({
    query: PokemonQuery,
    data: props.data,
  });
  console.log(result)
  return (
    <div>
      <h1>{result.site && result.site.name}</h1>
    </div>
  );
}

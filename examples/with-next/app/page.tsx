import Link from 'next/link';
import { cacheExchange, createClient, fetchExchange, gql } from '@urql/core';
import { registerUrql } from '@urql/next/rsc';

const makeClient = () => {
  return createClient({
    url: 'https://trygql.formidable.dev/graphql/basic-pokedex',
    exchanges: [cacheExchange, fetchExchange],
  });
};

const { getClient } = registerUrql(makeClient);

const PokemonsQuery = gql`
  query {
    pokemons(limit: 10) {
      id
      name
    }
  }
`;

export default async function Home() {
  const result = await getClient().query(PokemonsQuery, {});
  return (
    <main>
      <h1>This is rendered as part of an RSC</h1>
      <ul>
        {result.data.pokemons.map((x: any) => (
          <li key={x.id}>{x.name}</li>
        ))}
      </ul>
      <Link href="/non-rsc">Non RSC</Link>
    </main>
  );
}

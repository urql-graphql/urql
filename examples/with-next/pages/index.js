import { initUrqlClient, withUrqlClient } from "next-urql";
import {
  ssrExchange,
  dedupExchange,
  cacheExchange,
  fetchExchange,
  useQuery
} from "urql";

const POKEMONS_QUERY = `
  query {
    pokemons(limit: 10) {
      id
      name
    }
  }
`;

function Index(props) {
  const [res] = useQuery({ query: POKEMONS_QUERY });
  return (
    <div>
      <h1>Static</h1>
      {res.data.pokemons.map((pokemon) => (
        <div key={pokemon.id}>
          {pokemon.id} - {pokemon.name}
        </div>
      ))}
    </div>
  );
}

export default withUrqlClient(
  () => ({
    url: "https://trygql.dev/graphql/basic-pokedex"
  }),
  { ssr: true }
)(Index);

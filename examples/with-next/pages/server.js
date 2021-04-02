import { initUrqlClient } from "next-urql";
import {
  ssrExchange,
  dedupExchange,
  cacheExchange,
  fetchExchange,
  useQuery
} from "urql";

const TODOS_QUERY = `
  query { todos { id text } }
`;

function Server(props) {
  const [res] = useQuery({ query: TODOS_QUERY });
  return (
    <div>
      <h1>Server-side render</h1>
      {res.data.todos.map((todo) => (
        <div key={todo.id}>
          {todo.id} - {todo.text}
        </div>
      ))}
    </div>
  );
}

export async function getServerSideProps(ctx) {
  const ssrCache = ssrExchange({ isClient: false });
  const client = initUrqlClient({
    url: "http://localhost:3000/api/graphql",
    exchanges: [dedupExchange, cacheExchange, ssrCache, fetchExchange]
  });

  // This query is used to populate the cache for the query
  // used on this page.
  await client.query(TODOS_QUERY).toPromise();

  return {
    props: {
      // urqlState is a keyword here so withUrqlClient can pick it up.
      urqlState: ssrCache.extractData()
    },
  };
}

export default Server;

import { initUrqlClient } from "next-urql";
import {
  ssrExchange,
  dedupExchange,
  cacheExchange,
  fetchExchange,
  useQuery,
  useClient
} from "urql";

const TODOS_QUERY = `
  query { todos { id text } }
`;

function Static(props) {
  const client = useClient();
  console.log('static', client)
  const [res] = useQuery({ query: TODOS_QUERY });
  console.log(res);
  return (
    <div>
      <h1>Static</h1>
      {res.data.todos.map((todo) => (
        <div key={todo.id}>
          {todo.id} - {todo.text}
        </div>
      ))}
    </div>
  );
}

export async function getStaticProps(ctx) {
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

export default Static;

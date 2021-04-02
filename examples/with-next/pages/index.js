import { initUrqlClient, withUrqlClient } from "next-urql";
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

function Index(props) {
  const [res] = useQuery({ query: TODOS_QUERY });
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

export default withUrqlClient(
  () => ({
    url: "http://localhost:3000/api/graphql"
  }),
  { ssr: true }
)(Index);

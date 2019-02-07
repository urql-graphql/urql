import React, { FC } from 'react';
import { useQuery } from 'urql';
import { Error, Loading, Todo } from './components';

interface QueryResponse {
  todos: Array<{
    id: number;
    text: string;
  }>;
}

export const Home: FC = () => {
  const [query, executeQuery] = useQuery<QueryResponse>({ query: TodoQuery });

  const getContent = () => {
    if (query.fetching || query.data === undefined) {
      return <Loading />;
    }

    if (query.error) {
      return <Error>{query.error.message}</Error>;
    }

    return query.data.todos.map(todo => <Todo key={todo.id} {...todo} />);
  };

  return (
    <>
      {getContent()}
      <button onClick={executeQuery}>Refetch</button>
    </>
  );
};

const TodoQuery = `
query {
  todos {
    id
    text
  }
  user {
    name
  }
}
`;

import React, { FC, useCallback } from 'react';
import gql from 'graphql-tag';
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
  const refetch = useCallback(
    () => executeQuery({ requestPolicy: 'network-only' }),
    []
  );

  const getContent = () => {
    if (query.fetching || query.data === undefined) {
      return <Loading />;
    }

    if (query.error) {
      return <Error>{query.error.message}</Error>;
    }

    return (
      <ul>
        {query.data.todos.map(todo => (
          <Todo key={todo.id} {...todo} />
        ))}
      </ul>
    );
  };

  return (
    <>
      {getContent()}
      <button onClick={refetch}>Refetch</button>
    </>
  );
};

const TodoQuery = gql`
  query {
    todos {
      id
      text
      complete
    }
  }
`;

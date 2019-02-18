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
  const [res, executeQuery] = useQuery<QueryResponse>({ query: TodoQuery });
  const refetch = useCallback(
    () => executeQuery({ requestPolicy: 'network-only' }),
    []
  );

  const getContent = () => {
    if (res.fetching || res.data === undefined) {
      return <Loading />;
    }

    if (res.error) {
      return <Error>{res.error.message}</Error>;
    }

    return (
      <ul>
        {res.data.todos.map(todo => (
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

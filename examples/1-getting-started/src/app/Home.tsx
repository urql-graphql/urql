import React, { FC, useCallback, useMemo } from 'react';
import gql from 'graphql-tag';
import { useQuery } from 'urql';
import { Error, Loading, Todo } from './components';

interface ITodo {
  id: string;
  text: string;
  complete: boolean;
}

interface QueryResponse {
  todos: ITodo[];
}

export const Home: FC = () => {
  console.log('render home');
  const [res, executeQuery] = useQuery<QueryResponse>({ query: TodoQuery });
  const refetch = useCallback(
    () => executeQuery({ requestPolicy: 'network-only' }),
    []
  );

  const todos = useMemo(() => {
    if (res.fetching || res.data === undefined) {
      return <Loading />;
    }

    if (res.error) {
      return <Error>{res.error.message}</Error>;
    }

    return (
      <ul>
        {res.data.todos.map((todo: ITodo) => (
          <Todo key={todo.id} {...todo} />
        ))}
      </ul>
    );
  }, [res]);

  return (
    <>
      {todos}
      <button onClick={refetch}>Refetch</button>
    </>
  );
};

Home.displayName = 'Home';

const TodoQuery = gql`
  query {
    todos {
      id
      text
      complete
    }
  }
`;

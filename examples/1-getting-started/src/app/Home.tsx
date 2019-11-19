import React, { FC, useCallback, useMemo } from 'react';
import gql from 'graphql-tag';
import { useQuery, useMutation } from 'urql';
import { Error, Loading, Todo, NewTodo } from './components';

interface ITodo {
  id: string;
  text: string;
  complete: boolean;
}

interface QueryResponse {
  todos: ITodo[];
}

const ToggleTodo = `
  mutation($id: ID!) {
    toggleTodo(id: $id) {
      todo @populate
      viewer {
        todos @populate
      }
    }
  }
`;

const DeleteTodo = `
  mutation($id: ID!) {
    deleteTodo(id: $id) {
      todo @populate
      viewer {
        todos @populate
      }
    }
  }
`;

const TodoQuery = gql`
  query {
    todos {
      id
      text
      complete
    }
  }
`;

export const Home: FC = () => {
  const [res, executeQuery] = useQuery<QueryResponse>({
    query: TodoQuery,
    requestPolicy: 'cache-and-network',
  });
  const refetch = useCallback(
    () => executeQuery({ requestPolicy: 'network-only' }),
    [executeQuery]
  );

  const [toggleTodoMutation, executeToggleTodoMutation] = useMutation(
    ToggleTodo
  );
  const [deleteTodoMutation, executeDeleteTodoMutation] = useMutation(
    DeleteTodo
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
          <Todo
            deleteTodo={() => executeDeleteTodoMutation({ id: todo.id })}
            toggleTodo={() => executeToggleTodoMutation({ id: todo.id })}
            key={todo.id}
            {...todo}
            loading={toggleTodoMutation.fetching}
            disabled={
              toggleTodoMutation.fetching || deleteTodoMutation.fetching
            }
          />
        ))}
      </ul>
    );
  }, [
    res,
    toggleTodoMutation,
    deleteTodoMutation,
    executeToggleTodoMutation,
    executeDeleteTodoMutation,
  ]);

  return (
    <>
      <NewTodo />
      {todos}
      <button onClick={refetch}>Refetch</button>
    </>
  );
};

Home.displayName = 'Home';

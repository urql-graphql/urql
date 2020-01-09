import React, { FC, useCallback, useMemo, useState } from 'react';
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
      id
      complete
    }
  }
`;

const DeleteTodo = `
  mutation($id: ID!) {
    deleteTodo(id: $id) {
      id
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
const Todos2 = () => {
  const [res] = useQuery<QueryResponse>({ query: TodoQuery });
  if (res.fetching) throw new Error('NOOOOO');
  return (
    <ul>
      {res.data.todos.map((todo: ITodo) => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
};

export const Home: FC = () => {
  const [res, executeQuery] = useQuery<QueryResponse>({ query: TodoQuery });
  const [state, set] = useState(false);
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
      {state && <Todos2 />}
      <button onClick={() => set(true)}>Show 2</button>
    </>
  );
};

Home.displayName = 'Home';

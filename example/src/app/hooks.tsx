/* tslint:disable */

import * as React from 'react';
import {
  unstable_useQuery as useQuery,
  unstable_useMutation as useMutation,
} from '../../../src/index';
import TodoList from './todo-list';
import TodoForm from './todo-form';

type Todo = { id: string; text: string };

const TodoApp: React.SFC<{ path: string }> = () => {
  const { data, loaded, refetch } = useQuery<{ todos: Todo[] }>(TodoQuery);
  const addTodo = useMutation<{ text: string }>(AddTodo);
  const removeTodo = useMutation<{ id: string }>(RemoveTodo);

  return (
    <div>
      {!loaded ? (
        <Loading />
      ) : (
        <TodoList todos={data.todos} removeTodo={removeTodo} />
      )}

      <TodoForm addTodo={addTodo} />

      <button type="button" onClick={() => refetch({})}>
        Refetch
      </button>
      <button type="button" onClick={refetch.bind(null, { skipCache: true })}>
        Refetch (Skip Cache)
      </button>
    </div>
  );
};

const Loading = () => <p>Loading...</p>;

const Error = () => <p>Error!</p>;

const AddTodo = `
mutation($text: String!) {
  addTodo(text: $text) {
    id
    text
  }
}
`;

const RemoveTodo = `
mutation($id: ID!) {
  removeTodo(id: $id) {
    id
  }
}
`;

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

export default TodoApp;

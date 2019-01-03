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
  const reset = useMutation<{}>(Reset);

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
      <button
        id="refetch"
        type="button"
        onClick={refetch.bind(null, { skipCache: true })}
      >
        Refetch (Skip Cache)
      </button>
      <button id="reset" type="button" onClick={() => reset({})}>
        Reset Backend Store
      </button>
    </div>
  );
};

const Loading = () => <p>Loading...</p>;

const Error = () => <p>Error!</p>;

const Reset = `
mutation {
  reset {
    id
    text
  }
}
`;

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

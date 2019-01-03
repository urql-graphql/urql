/* tslint:disable */

import * as React from 'react';
import { Connect, createQuery, createMutation } from '../../../src/';
import TodoList from './todo-list';
import TodoForm from './todo-form';

export interface ITodoQuery {
  todos: Array<{ id: string; text: string }>;
  user: {
    name: string;
  };
}

export interface ITodoMutations {
  addTodo: (input: { text: string }) => void;
  removeTodo: (input: { id: string }) => void;
}

const TodoApp: React.SFC<{ path: string }> = () => (
  <Connect
    query={createQuery(TodoQuery)}
    mutations={{
      addTodo: createMutation(AddTodo),
      removeTodo: createMutation(RemoveTodo),
      reset: createMutation(Reset),
    }}
    children={({ data, error, mutations, fetching, refetch }) => {
      const content = fetching ? (
        <Loading />
      ) : error ? (
        <Error />
      ) : (
        <TodoList todos={data.todos} removeTodo={mutations.removeTodo} />
      );

      return (
        <div>
          {content}
          <TodoForm addTodo={mutations.addTodo} />
          <button type="button" onClick={() => refetch()}>
            Refetch
          </button>
          <button id="refetch" type="button" onClick={() => refetch(true)}>
            Refetch (Skip Cache)
          </button>
          <button id="reset" type="button" onClick={() => mutations.reset({})}>
            Reset Backend Store
          </button>
        </div>
      );
    }}
  />
);

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

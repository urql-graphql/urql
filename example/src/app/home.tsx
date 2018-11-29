/* tslint:disable */

import * as React from 'react';
import { Connect, createQuery, createMutation } from '../../../src/';
import TodoList from './todo-list';
import TodoForm from './todo-form';
import Loading from './loading';

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

const Home: React.SFC<{}> = () => (
  <Connect
    query={createQuery(TodoQuery)}
    mutation={{
      addTodo: createMutation(AddTodo),
      removeTodo: createMutation(RemoveTodo),
    }}
    children={({ data, mutations, fetching, refetch }) => {
      return (
        <div>
          {fetching ? (
            <Loading />
          ) : (
            <TodoList todos={data.todos} removeTodo={mutations.removeTodo} />
          )}
          <TodoForm addTodo={mutations.addTodo} />
          <button type="button" onClick={() => refetch()}>
            Refetch
          </button>
          <button type="button" onClick={() => refetch(true)}>
            Refetch (Skip Cache)
          </button>
        </div>
      );
    }}
  />
);

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

export default Home;

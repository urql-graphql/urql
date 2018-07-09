/* tslint:disable */

import * as React from 'react';
import { Connect, query, mutation, UrqlProps } from '../../../src/index';
import TodoList from './todo-list';
import TodoForm from './todo-form';
import Loading from './loading';
import { Url } from 'url';

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
    query={query(TodoQuery)}
    mutation={{
      addTodo: mutation(AddTodo),
      removeTodo: mutation(RemoveTodo),
    }}
    children={({
      cache,
      loaded,
      data,
      addTodo,
      removeTodo,
      refetch,
    }: UrqlProps<ITodoQuery, ITodoMutations>) => {
      return (
        <div>
          {!loaded ? (
            <Loading />
          ) : (
            <TodoList todos={data.todos} removeTodo={removeTodo} />
          )}
          <TodoForm
            addTodo={text => {
              addTodo(text);
              if (data.todos.length === 0) {
                // renew the cache as it won't be invalidated based on __typename
                // when the existing cache contains an empty list
                refetch({ skipCache: true });
              }
            }}
          />
          <button type="button" onClick={() => refetch({})}>
            Refetch
          </button>
          <button
            type="button"
            onClick={refetch.bind(null, { skipCache: true })}
          >
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

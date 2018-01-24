import React from 'react';
import { Connect, query, mutation } from '../../../src/index';
import TodoList from './todo-list';
import TodoForm from './todo-form';
import Loading from './loading';

const Home = () => (
  <Connect
    query={query(TodoQuery)}
    mutation={{
      addTodo: mutation(AddTodo),
      removeTodo: mutation(RemoveTodo),
    }}
    render={({ loaded, data, addTodo, removeTodo }) => {
      return (
        <div>
          {!loaded ? (
            <Loading />
          ) : (
            <TodoList todos={data.todos} removeTodo={removeTodo} />
          )}
          <TodoForm addTodo={addTodo} />
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

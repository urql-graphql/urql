/* tslint:disable */

import * as React from 'react';
import {
  unstable_useQuery as useQuery,
  unstable_useMutation as useMutation,
} from '../../../src/index';
import TodoList from './todo-list';
import TodoForm from './todo-form';
import Loading from './loading';

type Todo = { id: string; text: string };

const Home: React.SFC<{}> = () => {
  const { data, loaded, refetch } = useQuery<{ todos: Todo[] }>(TodoQuery);
  const addTodo = useMutation<{ text: string }, Todo>(AddTodo);
  const removeTodo = useMutation<{ id: string }, Todo>(RemoveTodo);

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

import gql from 'graphql-tag';
import { query, write } from '../operations';
import { create, serialize } from '../store';

const Todos = gql`
  query {
    __typename
    todos {
      __typename
      id
      text
      complete
    }
  }
`;

const ToggleTodo = gql`
  mutation($id: ID!) {
    __typename
    toggleTodo(id: $id) {
      __typename
      id
      text
      complete
    }
  }
`;

it('passes the "getting-started" example', () => {
  const store = create();
  const todosData = {
    __typename: 'Query',
    todos: [
      { id: '0', text: 'Go to the shops', complete: false, __typename: 'Todo' },
      { id: '1', text: 'Pick up the kids', complete: true, __typename: 'Todo' },
      { id: '2', text: 'Install urql', complete: false, __typename: 'Todo' },
    ],
  };

  const writeRes = write(store, { query: Todos }, todosData);

  expect(writeRes.dependencies).toEqual([
    'Query.todos',
    'Todo:0',
    'Todo:1',
    'Todo:2',
  ]);

  expect(serialize(store)).toMatchSnapshot();

  let queryRes = query(store, { query: Todos });

  expect(queryRes.data).toEqual(todosData);
  expect(queryRes.dependencies).toEqual(writeRes.dependencies);
  expect(queryRes.isComplete).toBe(true);

  const mutatedTodo = {
    ...todosData.todos[2],
    complete: true,
  };

  const mutationRes = write(
    store,
    { query: ToggleTodo, variables: { id: '2' } },
    {
      __typename: 'Mutation',
      toggleTodo: mutatedTodo,
    }
  );

  expect(mutationRes.dependencies).toEqual(['Todo:2']);
  expect(serialize(store)).toMatchSnapshot();

  queryRes = query(store, { query: Todos });

  expect(queryRes.isComplete).toBe(true);
  expect(queryRes.data).toEqual({
    ...todosData,
    todos: [...todosData.todos.slice(0, 2), mutatedTodo],
  });
});

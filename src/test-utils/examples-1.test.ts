import gql from 'graphql-tag';
import { query, write } from '../operations';
import { Store } from '../store';

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
  const store = new Store();
  const todosData = {
    __typename: 'Query',
    todos: [
      { id: '0', text: 'Go to the shops', complete: false, __typename: 'Todo' },
      { id: '1', text: 'Pick up the kids', complete: true, __typename: 'Todo' },
      { id: '2', text: 'Install urql', complete: false, __typename: 'Todo' },
    ],
  };

  const writeRes = write(store, { query: Todos }, todosData);

  const expectedSet = new Set(['Query.todos', 'Todo:0', 'Todo:1', 'Todo:2']);
  expect(writeRes.dependencies).toEqual(expectedSet);

  expect(store.serialize()).toMatchSnapshot();

  let queryRes = query(store, { query: Todos });

  expect(queryRes.data).toEqual(todosData);
  expect(queryRes.dependencies).toEqual(writeRes.dependencies);
  expect(queryRes.completeness).toBe('FULL');

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

  expect(mutationRes.dependencies).toEqual(new Set(['Todo:2']));
  expect(store.serialize()).toMatchSnapshot();

  queryRes = query(store, { query: Todos });

  expect(queryRes.completeness).toBe('FULL');
  expect(queryRes.data).toEqual({
    ...todosData,
    todos: [...todosData.todos.slice(0, 2), mutatedTodo],
  });
});

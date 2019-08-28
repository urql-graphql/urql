import gql from 'graphql-tag';
import { query, write } from '../operations';
import { Store } from '../store';
import { Data } from '../types';

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

const NestedClearNameTodo = gql`
  mutation($id: ID!) {
    __typename
    clearName(id: $id) {
      __typename
      todo {
        __typename
        id
        text
        complete
      }
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

  queryRes = query(store, { query: Todos });

  expect(queryRes.completeness).toBe('FULL');
  expect(queryRes.data).toEqual({
    ...todosData,
    todos: [...todosData.todos.slice(0, 2), mutatedTodo],
  });

  const newMutatedTodo = {
    ...mutatedTodo,
    text: '',
  };

  const newMutationRes = write(
    store,
    { query: NestedClearNameTodo, variables: { id: '2' } },
    {
      __typename: 'Mutation',
      clearName: {
        __typename: 'ClearName',
        todo: newMutatedTodo,
      },
    }
  );

  expect(newMutationRes.dependencies).toEqual(new Set(['Todo:2']));

  queryRes = query(store, { query: Todos });

  expect(queryRes.completeness).toBe('FULL');
  expect(queryRes.data).toEqual({
    ...todosData,
    todos: [...todosData.todos.slice(0, 2), newMutatedTodo],
  });
});

it('respects property-level resolvers when given', () => {
  const store = new Store({ Todo: { text: () => 'hi' } });
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

  let queryRes = query(store, { query: Todos });

  expect(queryRes.data).toEqual({
    __typename: 'Query',
    todos: [
      { id: '0', text: 'hi', complete: false, __typename: 'Todo' },
      { id: '1', text: 'hi', complete: true, __typename: 'Todo' },
      { id: '2', text: 'hi', complete: false, __typename: 'Todo' },
    ],
  });
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

  queryRes = query(store, { query: Todos });

  expect(queryRes.completeness).toBe('FULL');
  expect(queryRes.data).toEqual({
    ...todosData,
    todos: [
      { id: '0', text: 'hi', complete: false, __typename: 'Todo' },
      { id: '1', text: 'hi', complete: true, __typename: 'Todo' },
      { id: '2', text: 'hi', complete: true, __typename: 'Todo' },
    ],
  });
});

it('Respects property-level resolvers when given', () => {
  const store = new Store(undefined, {
    Mutation: {
      toggleTodo: function toggleTodo(result, _, cache) {
        cache.updateQuery({ query: Todos }, data => {
          if (
            data &&
            data.todos &&
            result &&
            result.toggleTodo &&
            (result.toggleTodo as any).id === '1'
          ) {
            data.todos[1] = {
              id: '1',
              text: `${data.todos[1].text} (Updated)`,
              complete: (result.toggleTodo as any).complete,
              __typename: 'Todo',
            };
          } else if (data && data.todos) {
            data.todos[Number((result.toggleTodo as any).id)] = {
              ...data.todos[Number((result.toggleTodo as any).id)],
              complete: (result.toggleTodo as any).complete,
            };
          }
          return data as Data;
        });
      },
    },
  });

  const todosData = {
    __typename: 'Query',
    todos: [
      { id: '0', text: 'Go to the shops', complete: false, __typename: 'Todo' },
      {
        id: '1',
        text: 'Pick up the kids',
        complete: false,
        __typename: 'Todo',
      },
      { id: '2', text: 'Install urql', complete: false, __typename: 'Todo' },
    ],
  };

  write(store, { query: Todos }, todosData);

  write(
    store,
    { query: ToggleTodo, variables: { id: '1' } },
    {
      __typename: 'Mutation',
      toggleTodo: {
        ...todosData.todos[1],
        complete: true,
      },
    }
  );

  write(
    store,
    { query: ToggleTodo, variables: { id: '2' } },
    {
      __typename: 'Mutation',
      toggleTodo: {
        ...todosData.todos[2],
        complete: true,
      },
    }
  );

  const queryRes = query(store, { query: Todos });

  expect(queryRes.completeness).toBe('FULL');
  expect(queryRes.data).toEqual({
    ...todosData,
    todos: [
      todosData.todos[0],
      {
        id: '1',
        text: 'Pick up the kids (Updated)',
        complete: true,
        __typename: 'Todo',
      },
      { id: '2', text: 'Install urql', complete: true, __typename: 'Todo' },
    ],
  });
});

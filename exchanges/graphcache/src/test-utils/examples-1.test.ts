import { gql } from '@urql/core';
import { query, write, writeOptimistic } from '../operations';
import * as InMemoryData from '../store/data';
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

const TodoFragment = gql`
  fragment _ on Todo {
    __typename
    id
    text
    complete
  }
`;

const Todo = gql`
  query($id: ID!) {
    __typename
    todo(id: $id) {
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

afterEach(() => {
  expect(console.warn).not.toHaveBeenCalled();
});

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

  expect(writeRes.dependencies).toEqual({
    'Query.todos': true,
    'Todo:0': true,
    'Todo:1': true,
    'Todo:2': true,
  });

  let queryRes = query(store, { query: Todos });

  expect(queryRes.data).toEqual(todosData);
  expect(queryRes.dependencies).toEqual(writeRes.dependencies);
  expect(queryRes.partial).toBe(false);

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

  expect(mutationRes.dependencies).toEqual({ 'Todo:2': true });

  queryRes = query(store, { query: Todos });

  expect(queryRes.partial).toBe(false);
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

  expect(newMutationRes.dependencies).toEqual({ 'Todo:2': true });

  queryRes = query(store, { query: Todos });

  expect(queryRes.partial).toBe(false);
  expect(queryRes.data).toEqual({
    ...todosData,
    todos: [...todosData.todos.slice(0, 2), newMutatedTodo],
  });
});

it('resolves missing, nullable arguments on fields', () => {
  const store = new Store();

  const GetWithVariables = gql`
    query {
      __typename
      todo(first: null) {
        __typename
        id
      }
    }
  `;

  const GetWithoutVariables = gql`
    query {
      __typename
      todo {
        __typename
        id
      }
    }
  `;

  const dataToWrite = {
    __typename: 'Query',
    todo: {
      __typename: 'Todo',
      id: '123',
    },
  };

  write(store, { query: GetWithVariables }, dataToWrite);
  const { data } = query(store, { query: GetWithoutVariables });
  expect(data).toEqual(dataToWrite);
});

it('should link entities', () => {
  const store = new Store({
    resolvers: {
      Query: {
        todo: (_parent, args) => {
          return { __typename: 'Todo', ...args };
        },
      },
    },
  });

  const todosData = {
    __typename: 'Query',
    todos: [
      { id: '0', text: 'Go to the shops', complete: false, __typename: 'Todo' },
      { id: '1', text: 'Pick up the kids', complete: true, __typename: 'Todo' },
      { id: '2', text: 'Install urql', complete: false, __typename: 'Todo' },
    ],
  };

  write(store, { query: Todos }, todosData);
  const res = query(store, { query: Todo, variables: { id: '0' } });
  expect(res.data).toEqual({
    __typename: 'Query',
    todo: {
      id: '0',
      text: 'Go to the shops',
      complete: false,
    },
  });
});

it('should not link entities when writing', () => {
  const store = new Store({
    resolvers: {
      Todo: {
        text: () => '[redacted]',
      },
    },
  });

  const todosData = {
    __typename: 'Query',
    todos: [
      { id: '0', text: 'Go to the shops', complete: false, __typename: 'Todo' },
      { id: '1', text: 'Pick up the kids', complete: true, __typename: 'Todo' },
      { id: '2', text: 'Install urql', complete: false, __typename: 'Todo' },
    ],
  };

  write(store, { query: Todos }, todosData);

  InMemoryData.initDataState('write', store.data, null);
  let data = store.readFragment(TodoFragment, { __typename: 'Todo', id: '0' });

  expect(data).toEqual({
    id: '0',
    text: 'Go to the shops',
    complete: false,
    __typename: 'Todo',
  });

  InMemoryData.initDataState('read', store.data, null);
  data = store.readFragment(TodoFragment, { __typename: 'Todo', id: '0' });

  expect(data).toEqual({
    id: '0',
    text: '[redacted]',
    complete: false,
    __typename: 'Todo',
  });
});

it('respects property-level resolvers when given', () => {
  const store = new Store({
    resolvers: {
      Todo: { text: () => 'hi' },
    },
  });
  const todosData = {
    __typename: 'Query',
    todos: [
      { id: '0', text: 'Go to the shops', complete: false, __typename: 'Todo' },
      { id: '1', text: 'Pick up the kids', complete: true, __typename: 'Todo' },
      { id: '2', text: 'Install urql', complete: false, __typename: 'Todo' },
    ],
  };

  const writeRes = write(store, { query: Todos }, todosData);

  expect(writeRes.dependencies).toEqual({
    'Query.todos': true,
    'Todo:0': true,
    'Todo:1': true,
    'Todo:2': true,
  });

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
  expect(queryRes.partial).toBe(false);

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

  expect(mutationRes.dependencies).toEqual({ 'Todo:2': true });

  queryRes = query(store, { query: Todos });

  expect(queryRes.partial).toBe(false);
  expect(queryRes.data).toEqual({
    ...todosData,
    todos: [
      { id: '0', text: 'hi', complete: false, __typename: 'Todo' },
      { id: '1', text: 'hi', complete: true, __typename: 'Todo' },
      { id: '2', text: 'hi', complete: true, __typename: 'Todo' },
    ],
  });
});

it('respects Mutation update functions', () => {
  const store = new Store({
    updates: {
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

  expect(queryRes.partial).toBe(false);
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

it('correctly resolves optimistic updates on Relay schemas', () => {
  const store = new Store({
    optimistic: {
      updateItem: variables => ({
        __typename: 'UpdateItemPayload',
        item: {
          __typename: 'Item',
          id: variables.id as string,
          name: 'Offline',
        },
      }),
    },
  });

  const queryData = {
    __typename: 'Query',
    root: {
      __typename: 'Root',
      id: 'root',
      items: {
        __typename: 'ItemConnection',
        edges: [
          {
            __typename: 'ItemEdge',
            node: {
              __typename: 'Item',
              id: '1',
              name: 'Number One',
            },
          },
          {
            __typename: 'ItemEdge',
            node: {
              __typename: 'Item',
              id: '2',
              name: 'Number Two',
            },
          },
        ],
      },
    },
  };

  const getRoot = gql`
    query GetRoot {
      root {
        __typename
        id
        items {
          __typename
          edges {
            __typename
            node {
              __typename
              id
              name
            }
          }
        }
      }
    }
  `;

  const updateItem = gql`
    mutation UpdateItem($id: ID!) {
      updateItem(id: $id) {
        __typename
        item {
          __typename
          id
          name
        }
      }
    }
  `;

  write(store, { query: getRoot }, queryData);
  writeOptimistic(store, { query: updateItem, variables: { id: '2' } }, 1);
  InMemoryData.noopDataState(store.data, 1);
  const queryRes = query(store, { query: getRoot });

  expect(queryRes.partial).toBe(false);
  expect(queryRes.data).not.toBe(null);
});

it('allows cumulative optimistic updates', () => {
  let counter = 1;

  const store = new Store({
    updates: {
      Mutation: {
        addTodo: (result, _, cache) => {
          cache.updateQuery({ query: Todos }, data => {
            (data as any).todos.push(result.addTodo);
            return data as Data;
          });
        },
      },
    },
    optimistic: {
      addTodo: () => ({
        __typename: 'Todo',
        id: 'optimistic_' + ++counter,
        text: '',
        complete: false,
      }),
    },
  });

  const todosData = {
    __typename: 'Query',
    todos: [
      { id: '0', complete: true, text: '0', __typename: 'Todo' },
      { id: '1', complete: true, text: '1', __typename: 'Todo' },
    ],
  };

  write(store, { query: Todos }, todosData);

  const AddTodo = gql`
    mutation {
      __typename
      addTodo {
        __typename
        complete
        text
        id
      }
    }
  `;

  writeOptimistic(store, { query: AddTodo }, 1);
  writeOptimistic(store, { query: AddTodo }, 2);

  const queryRes = query(store, { query: Todos });

  expect(queryRes.partial).toBe(false);
  expect(queryRes.data).toEqual({
    ...todosData,
    todos: [
      todosData.todos[0],
      todosData.todos[1],
      { __typename: 'Todo', text: '', complete: false, id: 'optimistic_2' },
      { __typename: 'Todo', text: '', complete: false, id: 'optimistic_3' },
    ],
  });
});

it('supports clearing a layer then reapplying optimistic updates', () => {
  let counter = 1;

  const store = new Store({
    updates: {
      Mutation: {
        addTodo: (result, _, cache) => {
          cache.updateQuery({ query: Todos }, data => {
            (data as any).todos.push(result.addTodo);
            return data as Data;
          });
        },
      },
    },
    optimistic: {
      addTodo: () => ({
        __typename: 'Todo',
        id: 'optimistic_' + ++counter,
        text: '',
        complete: false,
      }),
    },
  });

  const todosData = {
    __typename: 'Query',
    todos: [
      { id: '0', complete: true, text: '0', __typename: 'Todo' },
      { id: '1', complete: true, text: '1', __typename: 'Todo' },
    ],
  };

  write(store, { query: Todos }, todosData);

  const AddTodo = gql`
    mutation {
      __typename
      addTodo {
        __typename
        complete
        text
        id
      }
    }
  `;

  writeOptimistic(store, { query: AddTodo }, 1);
  writeOptimistic(store, { query: AddTodo }, 1);

  InMemoryData.noopDataState(store.data, 1);

  writeOptimistic(store, { query: AddTodo }, 1);
  writeOptimistic(store, { query: AddTodo }, 1);

  const queryRes = query(store, { query: Todos });

  expect(queryRes.partial).toBe(false);
  expect(queryRes.data).toEqual({
    ...todosData,
    todos: [
      todosData.todos[0],
      todosData.todos[1],
      { __typename: 'Todo', text: '', complete: false, id: 'optimistic_4' },
      { __typename: 'Todo', text: '', complete: false, id: 'optimistic_5' },
    ],
  });
});

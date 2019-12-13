import gql from 'graphql-tag';

import { Data } from '../types';
import { query } from '../operations/query';
import { write, writeOptimistic } from '../operations/write';
import * as InMemoryData from './data';
import { Store } from './store';

const Appointment = gql`
  query appointment($id: String) {
    appointment(id: $id) {
      __typename
      id
      info
    }
  }
`;

const Todos = gql`
  query {
    __typename
    todos {
      __typename
      id
      text
      complete
      author {
        id
        name
      }
    }
  }
`;

describe('Store with KeyingConfig', () => {
  it('generates keys from custom keying function', () => {
    const store = new Store(undefined, undefined, undefined, undefined, {
      User: () => 'me',
      None: () => null,
    });

    expect(store.keyOfEntity({ __typename: 'Any', id: '123' })).toBe('Any:123');
    expect(store.keyOfEntity({ __typename: 'Any', _id: '123' })).toBe(
      'Any:123'
    );
    expect(store.keyOfEntity({ __typename: 'Any' })).toBe(null);
    expect(store.keyOfEntity({ __typename: 'User' })).toBe('User:me');
    expect(store.keyOfEntity({ __typename: 'None' })).toBe(null);
  });
});

describe('Store with OptimisticMutationConfig', () => {
  let store, todosData;

  beforeEach(() => {
    store = new Store(undefined, undefined, undefined, {
      addTodo: variables => {
        return {
          ...variables,
        } as Data;
      },
    });
    todosData = {
      __typename: 'Query',
      todos: [
        {
          id: '0',
          text: 'Go to the shops',
          complete: false,
          __typename: 'Todo',
          author: { id: '0', name: 'Jovi', __typename: 'Author' },
        },
        {
          id: '1',
          text: 'Pick up the kids',
          complete: true,
          __typename: 'Todo',
          author: { id: '1', name: 'Phil', __typename: 'Author' },
        },
        {
          id: '2',
          text: 'Install urql',
          complete: false,
          __typename: 'Todo',
          author: { id: '0', name: 'Jovi', __typename: 'Author' },
        },
      ],
    };
    InMemoryData.initDataState(store.data, 0);
    write(store, { query: Todos }, todosData);
    InMemoryData.initDataState(store.data, null);
  });

  it('Should resolve a property', () => {
    const todoResult = store.resolve({ __typename: 'Todo', id: '0' }, 'text');
    expect(todoResult).toEqual('Go to the shops');
    const authorResult = store.resolve(
      { __typename: 'Author', id: '0' },
      'name'
    );
    expect(authorResult).toBe('Jovi');
    const result = store.resolve({ id: 0, __typename: 'Todo' }, 'text');
    expect(result).toEqual('Go to the shops');
    // TODO: we have no way of asserting this to really be the case.
    const deps = InMemoryData.getCurrentDependencies();
    expect(deps).toEqual(new Set(['Todo:0', 'Author:0']));
    InMemoryData.clearDataState();
  });

  it('should resolve with a key as first argument', () => {
    const authorResult = store.resolve('Author:0', 'name');
    expect(authorResult).toBe('Jovi');
    const deps = InMemoryData.getCurrentDependencies();
    expect(deps).toEqual(new Set(['Author:0']));
    InMemoryData.clearDataState();
  });

  it('Should resolve a link property', () => {
    const parent = {
      id: '0',
      text: 'test',
      author: undefined,
      __typename: 'Todo',
    };
    const result = store.resolve(parent, 'author');
    expect(result).toEqual('Author:0');
    const deps = InMemoryData.getCurrentDependencies();
    expect(deps).toEqual(new Set(['Todo:0']));
    InMemoryData.clearDataState();
  });

  it('should be able to invalidate data (one relation key)', () => {
    let { data } = query(store, { query: Todos });

    InMemoryData.initDataState(store.data, 0);
    expect((data as any).todos).toHaveLength(3);
    expect(InMemoryData.readRecord('Todo:0', 'text')).toBe('Go to the shops');
    store.invalidateQuery(Todos);
    InMemoryData.clearDataState();

    ({ data } = query(store, { query: Todos }));
    expect(data).toBe(null);

    InMemoryData.initDataState(store.data, 0);
    expect(InMemoryData.readRecord('Todo:0', 'text')).toBe(undefined);
  });

  it('should be able to invalidate data with arguments', () => {
    write(
      store,
      {
        query: Appointment,
        variables: { id: '1' },
      },
      {
        __typename: 'Query',
        appointment: {
          __typename: 'Appointment',
          id: '1',
          info: 'urql meeting',
        },
      }
    );

    let { data } = query(store, {
      query: Appointment,
      variables: { id: '1' },
    });
    expect((data as any).appointment.info).toBe('urql meeting');

    InMemoryData.initDataState(store.data, 0);
    expect(InMemoryData.readRecord('Appointment:1', 'info')).toBe(
      'urql meeting'
    );
    store.invalidateQuery(Appointment, { id: '1' });
    InMemoryData.clearDataState();

    ({ data } = query(store, {
      query: Appointment,
      variables: { id: '1' },
    }));
    expect(data).toBe(null);

    InMemoryData.initDataState(store.data, 0);
    expect(InMemoryData.readRecord('Appointment:1', 'info')).toBe(undefined);
  });

  it('should be able to write a fragment', () => {
    InMemoryData.initDataState(store.data, 0);

    store.writeFragment(
      gql`
        fragment _ on Todo {
          id
          text
          complete
        }
      `,
      {
        id: '0',
        text: 'update',
        complete: true,
      }
    );

    const deps = InMemoryData.getCurrentDependencies();
    expect(deps).toEqual(new Set(['Todo:0']));

    const { data } = query(store, { query: Todos });

    expect(data).toEqual({
      __typename: 'Query',
      todos: [
        {
          ...todosData.todos[0],
          text: 'update',
          complete: true,
        },
        todosData.todos[1],
        todosData.todos[2],
      ],
    });
  });

  it('should be able to read a fragment', () => {
    InMemoryData.initDataState(store.data, 0);
    const result = store.readFragment(
      gql`
        fragment _ on Todo {
          id
          text
          complete
        }
      `,
      { id: '0' }
    );

    const deps = InMemoryData.getCurrentDependencies();
    expect(deps).toEqual(new Set(['Todo:0']));

    expect(result).toEqual({
      id: '0',
      text: 'Go to the shops',
      complete: false,
      __typename: 'Todo',
    });

    InMemoryData.clearDataState();
  });

  it('should be able to update a query', () => {
    InMemoryData.initDataState(store.data, 0);
    store.updateQuery({ query: Todos }, data => ({
      ...data,
      todos: [
        ...data.todos,
        {
          __typename: 'Todo',
          id: '4',
          text: 'Test updateQuery',
          complete: false,
          author: {
            id: '3',
            name: 'Andy',
          },
        },
      ],
    }));
    InMemoryData.clearDataState();

    const { data: result } = query(store, {
      query: Todos,
    });

    expect(result).toEqual({
      __typename: 'Query',
      todos: [
        ...todosData.todos,
        {
          __typename: 'Todo',
          id: '4',
          text: 'Test updateQuery',
          complete: false,
          author: {
            id: '3',
            name: 'Andy',
          },
        },
      ],
    });
  });

  it('should be able to update a query with variables', () => {
    write(
      store,
      {
        query: Appointment,
        variables: { id: '1' },
      },
      {
        __typename: 'Query',
        appointment: {
          __typename: 'Appointment',
          id: '1',
          info: 'urql meeting',
        },
      }
    );

    InMemoryData.initDataState(store.data, 0);
    store.updateQuery({ query: Appointment, variables: { id: '1' } }, data => ({
      ...data,
      appointment: {
        ...data.appointment,
        info: 'urql meeting revisited',
      },
    }));
    InMemoryData.clearDataState();

    const { data: result } = query(store, {
      query: Appointment,
      variables: { id: '1' },
    });
    expect(result).toEqual({
      __typename: 'Query',
      appointment: {
        id: '1',
        info: 'urql meeting revisited',
        __typename: 'Appointment',
      },
    });
  });

  it('should be able to read a query', () => {
    InMemoryData.initDataState(store.data, 0);
    const result = store.readQuery({ query: Todos });

    const deps = InMemoryData.getCurrentDependencies();
    expect(deps).toEqual(
      new Set([
        'Query.todos',
        'Todo:0',
        'Todo:1',
        'Todo:2',
        'Author:0',
        'Author:1',
      ])
    );

    expect(result).toEqual({
      __typename: 'Query',
      todos: todosData.todos,
    });
    InMemoryData.clearDataState();
  });

  it('should be able to optimistically mutate', () => {
    const { dependencies } = writeOptimistic(
      store,
      {
        query: gql`
          mutation {
            addTodo(
              id: "1"
              text: "I'm optimistic about this feature"
              complete: true
              __typename: "Todo"
            ) {
              id
              text
              complete
              __typename
            }
          }
        `,
      },
      1
    );
    expect(dependencies).toEqual(new Set(['Todo:1']));
    let { data } = query(store, { query: Todos });
    expect(data).toEqual({
      __typename: 'Query',
      todos: [
        todosData.todos[0],
        {
          id: '1',
          text: "I'm optimistic about this feature",
          complete: true,
          __typename: 'Todo',
          author: {
            __typename: 'Author',
            id: '1',
            name: 'Phil',
          },
        },
        todosData.todos[2],
      ],
    });

    InMemoryData.clearOptimistic(store.data, 1);
    ({ data } = query(store, { query: Todos }));
    expect(data).toEqual({
      __typename: 'Query',
      todos: todosData.todos,
    });
  });
});

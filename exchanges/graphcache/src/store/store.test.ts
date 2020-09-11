/* eslint-disable @typescript-eslint/no-var-requires */

import gql from 'graphql-tag';
import { minifyIntrospectionQuery } from '@urql/introspection';
import { mocked } from 'ts-jest/utils';

import { Data, StorageAdapter } from '../types';
import { query } from '../operations/query';
import { write, writeOptimistic } from '../operations/write';
import * as InMemoryData from './data';
import { Store } from './store';
import { noop } from '../test-utils/utils';
import { getIntrospectionQuery, parse } from 'graphql';

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
        __typename
        id
        name
      }
    }
  }
`;

const TodosWithoutTypename = gql`
  query {
    todos {
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

const todosData = {
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
} as any;

describe('Store', () => {
  it('supports unformatted query documents', () => {
    const store = new Store();

    // NOTE: This is the query without __typename annotations
    write(store, { query: TodosWithoutTypename }, todosData);
    const result = query(store, { query: TodosWithoutTypename });
    expect(result.data).toEqual(todosData);
  });
});

describe('Store with UpdatesConfig', () => {
  it("sets the store's updates field to the given argument", () => {
    const updatesOption = {
      Mutation: {
        toggleTodo: noop,
      },
      Subscription: {
        newTodo: noop,
      },
    };

    const store = new Store({
      updates: updatesOption,
    });

    expect(store.updates.Mutation).toBe(updatesOption.Mutation);
    expect(store.updates.Subscription).toBe(updatesOption.Subscription);
  });

  it("sets the store's updates field to an empty default if not provided", () => {
    const store = new Store({});

    expect(store.updates.Mutation).toEqual({});
    expect(store.updates.Subscription).toEqual({});
  });

  it('should not warn if Mutation/Subscription operations do exist in the schema', function () {
    new Store({
      schema: minifyIntrospectionQuery(
        require('../test-utils/simple_schema.json')
      ),
      updates: {
        Mutation: {
          toggleTodo: noop,
        },
        Subscription: {
          newTodo: noop,
        },
      },
    });

    expect(console.warn).not.toBeCalled();
  });

  it("should warn if Mutation operations don't exist in the schema", function () {
    new Store({
      schema: minifyIntrospectionQuery(
        require('../test-utils/simple_schema.json')
      ),
      updates: {
        Mutation: {
          doTheChaChaSlide: noop,
        },
      },
    });

    expect(console.warn).toBeCalledTimes(1);
    const warnMessage = mocked(console.warn).mock.calls[0][0];
    expect(warnMessage).toContain(
      'Invalid mutation field: `doTheChaChaSlide` is not in the defined schema, but the `updates.Mutation` option is referencing it.'
    );
    expect(warnMessage).toContain('https://bit.ly/2XbVrpR#21');
  });

  it("should warn if Subscription operations don't exist in the schema", function () {
    new Store({
      schema: minifyIntrospectionQuery(
        require('../test-utils/simple_schema.json')
      ),
      updates: {
        Subscription: {
          someoneDidTheChaChaSlide: noop,
        },
      },
    });

    expect(console.warn).toBeCalledTimes(1);
    const warnMessage = mocked(console.warn).mock.calls[0][0];
    expect(warnMessage).toContain(
      'Invalid subscription field: `someoneDidTheChaChaSlide` is not in the defined schema, but the `updates.Subscription` option is referencing it.'
    );
    expect(warnMessage).toContain('https://bit.ly/2XbVrpR#22');
  });
});

describe('Store with KeyingConfig', () => {
  it('generates keys from custom keying function', () => {
    const store = new Store({
      keys: {
        User: () => 'me',
        None: () => null,
      },
    });

    expect(store.keyOfEntity({ __typename: 'Any', id: '123' })).toBe('Any:123');
    expect(store.keyOfEntity({ __typename: 'Any', _id: '123' })).toBe(
      'Any:123'
    );
    expect(store.keyOfEntity({ __typename: 'Any' })).toBe(null);
    expect(store.keyOfEntity({ __typename: 'User' })).toBe('User:me');
    expect(store.keyOfEntity({ __typename: 'None' })).toBe(null);
  });

  it('should not warn if keys do exist in the schema', function () {
    new Store({
      schema: minifyIntrospectionQuery(
        require('../test-utils/simple_schema.json')
      ),
      keys: {
        Todo: () => 'Todo',
      },
    });

    expect(console.warn).not.toBeCalled();
  });

  it("should warn if a key doesn't exist in the schema", function () {
    new Store({
      schema: minifyIntrospectionQuery(
        require('../test-utils/simple_schema.json')
      ),
      keys: {
        Todo: () => 'todo',
        NotInSchema: () => 'foo',
      },
    });

    expect(console.warn).toBeCalledTimes(1);
    const warnMessage = mocked(console.warn).mock.calls[0][0];
    expect(warnMessage).toContain(
      'The type `NotInSchema` is not an object in the defined schema, but the `keys` option is referencing it'
    );
    expect(warnMessage).toContain('https://bit.ly/2XbVrpR#20');
  });
});

describe('Store with ResolverConfig', () => {
  it("sets the store's resolvers field to the given argument", () => {
    const resolversOption = {
      Query: {
        latestTodo: () => 'todo',
      },
    };

    const store = new Store({
      resolvers: resolversOption,
    });

    expect(store.resolvers).toBe(resolversOption);
  });

  it("sets the store's resolvers field to an empty default if not provided", () => {
    const store = new Store({});

    expect(store.resolvers).toEqual({});
  });

  it('should not warn if resolvers do exist in the schema', function () {
    new Store({
      schema: minifyIntrospectionQuery(
        require('../test-utils/simple_schema.json')
      ),
      resolvers: {
        Query: {
          latestTodo: () => 'todo',
          todos: () => ['todo 1', 'todo 2'],
        },
        Todo: {
          text: todo => (todo.text as string).toUpperCase(),
          author: todo => (todo.author as string).toUpperCase(),
        },
      },
    });

    expect(console.warn).not.toBeCalled();
  });

  it("should warn if a Query doesn't exist in the schema", function () {
    new Store({
      schema: minifyIntrospectionQuery(
        require('../test-utils/simple_schema.json')
      ),
      resolvers: {
        Query: {
          todos: () => ['todo 1', 'todo 2'],
          // This query should be warned about.
          findDeletedTodos: () => ['todo 1', 'todo 2'],
        },
      },
    });

    expect(console.warn).toBeCalledTimes(1);
    const warnMessage = mocked(console.warn).mock.calls[0][0];
    expect(warnMessage).toContain(
      'Invalid resolver: `Query.findDeletedTodos` is not in the defined schema, but the `resolvers` option is referencing it'
    );
    expect(warnMessage).toContain('https://bit.ly/2XbVrpR#23');
  });

  it("should warn if a type doesn't exist in the schema", function () {
    new Store({
      schema: minifyIntrospectionQuery(
        require('../test-utils/simple_schema.json')
      ),
      resolvers: {
        Todo: {
          complete: () => true,
        },
        // This type should be warned about.
        Dinosaur: {
          isExtinct: () => true,
        },
      },
    });

    expect(console.warn).toBeCalledTimes(1);
    const warnMessage = mocked(console.warn).mock.calls[0][0];
    expect(warnMessage).toContain(
      'Invalid resolver: `Dinosaur` is not in the defined schema, but the `resolvers` option is referencing it'
    );
    expect(warnMessage).toContain('https://bit.ly/2XbVrpR#23');
  });

  it("should warn if a type's property doesn't exist in the schema", function () {
    new Store({
      schema: minifyIntrospectionQuery(
        require('../test-utils/simple_schema.json')
      ),
      resolvers: {
        Todo: {
          complete: () => true,
          // This property should be warned about.
          isAboutDinosaurs: () => true,
        },
      },
    });

    expect(console.warn).toBeCalledTimes(1);
    const warnMessage = mocked(console.warn).mock.calls[0][0];
    expect(warnMessage).toContain(
      'Invalid resolver: `Todo.isAboutDinosaurs` is not in the defined schema, but the `resolvers` option is referencing it'
    );
    expect(warnMessage).toContain('https://bit.ly/2XbVrpR#23');
  });
});

describe('Store with OptimisticMutationConfig', () => {
  let store;

  beforeEach(() => {
    store = new Store({
      optimistic: {
        addTodo: variables => {
          return {
            ...variables,
          } as Data;
        },
      },
    });

    write(store, { query: Todos }, todosData);

    InMemoryData.initDataState('read', store.data, null);
  });

  it('should resolve a property', () => {
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
    expect(deps).toEqual({ 'Todo:0': true, 'Author:0': true });
    InMemoryData.clearDataState();
  });

  it('should resolve with a key as first argument', () => {
    const authorResult = store.resolve('Author:0', 'name');
    expect(authorResult).toBe('Jovi');
    const deps = InMemoryData.getCurrentDependencies();
    expect(deps).toEqual({ 'Author:0': true });
    InMemoryData.clearDataState();
  });

  it('should resolve a link property', () => {
    const parent = {
      id: '0',
      text: 'test',
      author: undefined,
      __typename: 'Todo',
    };
    const result = store.resolve(parent, 'author');
    expect(result).toEqual('Author:0');
    const deps = InMemoryData.getCurrentDependencies();
    expect(deps).toEqual({ 'Todo:0': true });
    InMemoryData.clearDataState();
  });

  it('should invalidate null keys correctly', () => {
    const connection = gql`
      query test {
        exercisesConnection(page: { after: null, first: 10 }) {
          id
        }
      }
    `;

    write(
      store,
      {
        query: connection,
      },
      {
        exercisesConnection: null,
      } as any
    );
    let { data } = query(store, { query: connection });

    InMemoryData.initDataState('read', store.data, null);
    expect((data as any).exercisesConnection).toEqual(null);
    const fields = store.inspectFields({ __typename: 'Query' });
    fields.forEach(({ fieldName, arguments: args }) => {
      if (fieldName === 'exercisesConnection') {
        store.invalidate('Query', fieldName, args);
      }
    });
    InMemoryData.clearDataState();

    ({ data } = query(store, { query: connection }));
    expect(data).toBe(null);
  });

  it('should be able to write a fragment', () => {
    InMemoryData.initDataState('read', store.data, null);

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
    expect(deps).toEqual({ 'Todo:0': true });

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
    InMemoryData.initDataState('read', store.data, null);
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
    expect(deps).toEqual({ 'Todo:0': true });

    expect(result).toEqual({
      id: '0',
      text: 'Go to the shops',
      complete: false,
      __typename: 'Todo',
    });

    InMemoryData.clearDataState();
  });

  it('should be able to update a query', () => {
    InMemoryData.initDataState('read', store.data, null);
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
            __typename: 'Author',
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
            __typename: 'Author',
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

    InMemoryData.initDataState('read', store.data, null);
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
    InMemoryData.initDataState('read', store.data, null);
    const result = store.readQuery({ query: Todos });

    const deps = InMemoryData.getCurrentDependencies();
    expect(deps).toEqual({
      'Query.todos': true,
      'Todo:0': true,
      'Todo:1': true,
      'Todo:2': true,
      'Author:0': true,
      'Author:1': true,
    });

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
    expect(dependencies).toEqual({ 'Todo:1': true });
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

    InMemoryData.noopDataState(store.data, 1);

    ({ data } = query(store, { query: Todos }));
    expect(data).toEqual({
      __typename: 'Query',
      todos: todosData.todos,
    });
  });

  describe('Invalidating an entity', () => {
    it('removes an entity from a list.', () => {
      store.invalidate(todosData.todos[1]);
      const { data } = query(store, { query: Todos });
      expect(data).toBe(null);
    });
  });
});

describe('Store with storage', () => {
  let store: Store;

  const expectedData = {
    __typename: 'Query',
    appointment: {
      __typename: 'Appointment',
      id: '1',
      info: 'urql meeting',
    },
  };

  beforeEach(() => {
    store = new Store();
  });

  it('should be able to store and rehydrate data', () => {
    const storage: StorageAdapter = {
      readData: jest.fn(),
      writeData: jest.fn(),
    };

    store.data.storage = storage;

    write(
      store,
      {
        query: Appointment,
        variables: { id: '1' },
      },
      expectedData
    );

    InMemoryData.initDataState('write', store.data, null);
    InMemoryData.persistData();
    InMemoryData.clearDataState();

    expect(storage.writeData).toHaveBeenCalled();

    const serialisedStore = (storage.writeData as any).mock.calls[0][0];
    expect(serialisedStore).toMatchSnapshot();

    store = new Store();
    InMemoryData.hydrateData(store.data, storage, serialisedStore);

    const { data } = query(store, {
      query: Appointment,
      variables: { id: '1' },
    });

    expect(data).toEqual(expectedData);
  });

  it('should be able to persist embedded data', () => {
    const EmbeddedAppointment = gql`
      query appointment($id: String) {
        appointment(id: $id) {
          __typename
          info
        }
      }
    `;

    const embeddedData = {
      ...expectedData,
      appointment: {
        ...expectedData.appointment,
        id: undefined,
      },
    } as any;

    const storage: StorageAdapter = {
      readData: jest.fn(),
      writeData: jest.fn(),
    };

    store.data.storage = storage;

    write(
      store,
      {
        query: EmbeddedAppointment,
        variables: { id: '1' },
      },
      embeddedData
    );

    InMemoryData.initDataState('write', store.data, null);
    InMemoryData.persistData();
    InMemoryData.clearDataState();

    expect(storage.writeData).toHaveBeenCalled();

    const serialisedStore = (storage.writeData as any).mock.calls[0][0];
    expect(serialisedStore).toMatchSnapshot();

    store = new Store();
    InMemoryData.hydrateData(store.data, storage, serialisedStore);

    const { data } = query(store, {
      query: EmbeddedAppointment,
      variables: { id: '1' },
    });

    expect(data).toEqual(embeddedData);
  });

  it('persists commutative layers and ignores optimistic layers', () => {
    const storage: StorageAdapter = {
      readData: jest.fn(),
      writeData: jest.fn(),
    };

    store.data.storage = storage;

    InMemoryData.reserveLayer(store.data, 1);

    InMemoryData.initDataState('write', store.data, 1);
    InMemoryData.writeRecord('Query', 'base', true);
    InMemoryData.clearDataState();

    InMemoryData.initDataState('write', store.data, 2, true);
    InMemoryData.writeRecord('Query', 'base', false);
    InMemoryData.clearDataState();

    InMemoryData.initDataState('write', store.data, null);
    expect(InMemoryData.readRecord('Query', 'base')).toBe(false);
    InMemoryData.persistData();
    InMemoryData.clearDataState();

    expect(storage.writeData).toHaveBeenCalled();
    const serialisedStore = (storage.writeData as any).mock.calls[0][0];

    expect(serialisedStore).toEqual({
      'Query.base': 'true',
    });

    store = new Store();
    InMemoryData.hydrateData(store.data, storage, serialisedStore);

    InMemoryData.initDataState('write', store.data, null);
    expect(InMemoryData.readRecord('Query', 'base')).toBe(true);
    InMemoryData.clearDataState();
  });

  it("should warn if an optimistic field doesn't exist in the schema's mutations", function () {
    new Store({
      schema: minifyIntrospectionQuery(
        require('../test-utils/simple_schema.json')
      ),
      updates: {
        Mutation: {
          toggleTodo: noop,
        },
      },
      optimistic: {
        toggleTodo: () => null,
        // This field should be warned about.
        deleteTodo: () => null,
      },
    });

    expect(console.warn).toBeCalledTimes(1);
    const warnMessage = mocked(console.warn).mock.calls[0][0];
    expect(warnMessage).toContain(
      'Invalid optimistic mutation field: `deleteTodo` is not a mutation field in the defined schema, but the `optimistic` option is referencing it.'
    );
    expect(warnMessage).toContain('https://bit.ly/2XbVrpR#24');
  });

  it('should not warn for an introspection result root', function () {
    // NOTE: Do not wrap this require in `minifyIntrospectionQuery`!
    // eslint-disable-next-line
    const schema = require('../test-utils/simple_schema.json');
    const store = new Store({ schema });

    query(store, { query: parse(getIntrospectionQuery()) }, schema);
    expect(console.warn).toBeCalledTimes(0);
  });
});

/* eslint-disable @typescript-eslint/no-var-requires */

import { gql, CombinedError } from '@urql/core';
import { minifyIntrospectionQuery } from '@urql/introspection';

import { write } from './write';
import * as InMemoryData from '../store/data';
import { Store } from '../store';

const TODO_QUERY = gql`
  query todos {
    todos {
      id
      text
      complete
      author {
        id
        name
        known
        __typename
      }
      __typename
    }
  }
`;

describe('Query', () => {
  let schema, store;

  beforeAll(() => {
    schema = minifyIntrospectionQuery(
      require('../test-utils/simple_schema.json')
    );
  });

  beforeEach(() => {
    store = new Store({ schema });
    write(
      store,
      { query: TODO_QUERY },
      {
        __typename: 'Query',
        todos: [
          { id: '0', text: 'Teach', __typename: 'Todo' },
          { id: '1', text: 'Learn', __typename: 'Todo' },
        ],
      }
    );

    jest.clearAllMocks();
  });

  it('should not crash for valid writes', async () => {
    const VALID_TODO_QUERY = gql`
      mutation {
        toggleTodo {
          id
          text
          complete
        }
      }
    `;
    write(
      store,
      { query: VALID_TODO_QUERY },
      {
        __typename: 'Mutation',
        toggleTodo: {
          __typename: 'Todo',
          id: '0',
          text: 'Teach',
          complete: true,
        },
      }
    );
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('should warn once for invalid fields on an entity', () => {
    const INVALID_TODO_QUERY = gql`
      mutation {
        toggleTodo {
          id
          text
          incomplete
        }
      }
    `;
    write(
      store,
      { query: INVALID_TODO_QUERY },
      {
        __typename: 'Mutation',
        toggleTodo: {
          __typename: 'Todo',
          id: '0',
          text: 'Teach',
          incomplete: false,
        },
      }
    );
    expect(console.warn).toHaveBeenCalledTimes(1);
    write(
      store,
      { query: INVALID_TODO_QUERY },
      {
        __typename: 'Mutation',
        toggleTodo: {
          __typename: 'Todo',
          id: '0',
          text: 'Teach',
          incomplete: false,
        },
      }
    );
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect((console.warn as any).mock.calls[0][0]).toMatch(
      /The field `incomplete` does not exist on `Todo`/
    );
  });

  it('should warn once for invalid link fields on an entity', () => {
    const INVALID_TODO_QUERY = gql`
      mutation {
        toggleTodo {
          id
          text
          writer {
            id
          }
        }
      }
    `;
    write(
      store,
      { query: INVALID_TODO_QUERY },
      {
        __typename: 'Mutation',
        toggleTodo: {
          __typename: 'Todo',
          id: '0',
          text: 'Teach',
          writer: {
            id: '0',
          },
        },
      }
    );
    // Because of us indicating Todo:Writer as a scalar
    expect(console.warn).toHaveBeenCalledTimes(2);
    expect((console.warn as any).mock.calls[0][0]).toMatch(
      /The field `writer` does not exist on `Todo`/
    );
  });

  it('should skip undefined values that are expected', () => {
    const query = gql`
      {
        field
      }
    `;

    write(store, { query }, { field: 'test' } as any);
    // This should not overwrite the field
    write(store, { query }, { field: undefined } as any);
    // Because of us writing an undefined field
    expect(console.warn).toHaveBeenCalledTimes(2);
    expect((console.warn as any).mock.calls[0][0]).toMatch(
      /The field `field` does not exist on `Query`/
    );

    InMemoryData.initDataState('read', store.data, null);
    // The field must still be `'test'`
    expect(InMemoryData.readRecord('Query', 'field')).toBe('test');
  });

  it('should write errored records as undefined rather than null', () => {
    const query = gql`
      {
        missingField
        setField
      }
    `;

    write(
      store,
      { query },
      { missingField: null, setField: 'test' } as any,
      new CombinedError({
        graphQLErrors: [
          {
            message: 'Test',
            path: ['missingField'],
          },
        ],
      })
    );

    InMemoryData.initDataState('read', store.data, null);

    // The setField must still be `'test'`
    expect(InMemoryData.readRecord('Query', 'setField')).toBe('test');
    // The missingField must still be `undefined`
    expect(InMemoryData.readRecord('Query', 'missingField')).toBe(undefined);
  });

  it('should write errored links as undefined rather than null', () => {
    const query = gql`
      {
        missingTodoItem: todos {
          id
          text
        }
        missingTodo: todo {
          id
          text
        }
      }
    `;

    write(
      store,
      { query },
      {
        missingTodoItem: [null, { __typename: 'Todo', id: 1, text: 'Learn' }],
        missingTodo: null,
      } as any,
      new CombinedError({
        graphQLErrors: [
          {
            message: 'Test',
            path: ['missingTodoItem', 0],
          },
          {
            message: 'Test',
            path: ['missingTodo'],
          },
        ],
      })
    );

    InMemoryData.initDataState('read', store.data, null);
    expect(InMemoryData.readLink('Query', 'todos')).toEqual([
      undefined,
      'Todo:1',
    ]);
    expect(InMemoryData.readLink('Query', 'todo')).toEqual(undefined);
  });
});

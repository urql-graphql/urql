import { Store } from '../store';
import gql from 'graphql-tag';
import { write } from './write';
import { SchemaPredicates } from '../ast/schemaPredicates';

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
  const spy: { console?: any } = {};

  beforeAll(() => {
    schema = require('../test-utils/simple_schema.json');
  });

  afterEach(() => {
    spy.console.mockRestore();
  });

  beforeEach(() => {
    store = new Store(new SchemaPredicates(schema));
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
    spy.console = jest.spyOn(console, 'warn');
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
    expect((console.warn as any).mock.calls[0][0]).toMatch(/incomplete/);
  });

  it('should warn once for invalid fields on an entity', () => {
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

    expect(console.warn).toHaveBeenCalledTimes(2);
    expect((console.warn as any).mock.calls[0][0]).toMatch(/writer/);
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
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect((console.warn as any).mock.calls[0][0]).toMatch(/undefined/);
    // The field must still be `'test'`
    expect(store.getRecord('Query', 'field')).toBe('test');
  });
});

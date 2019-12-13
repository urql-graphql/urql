import gql from 'graphql-tag';
import { write } from './write';
import { invalidate } from './invalidate';
import * as InMemoryData from '../store/data';
import { Store } from '../store';
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

    InMemoryData.initDataState(store.data, 0);
  });

  it('should warn once for invalid fields on an entity', () => {
    const INVALID_TODO_QUERY = gql`
      query {
        todos {
          id
          text
          incomplete
        }
      }
    `;
    invalidate(store, { query: INVALID_TODO_QUERY });
    expect(console.warn).toHaveBeenCalledTimes(1);
    invalidate(store, { query: INVALID_TODO_QUERY });
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect((console.warn as any).mock.calls[0][0]).toMatch(/incomplete/);
  });

  it('should warn once for invalid sub-entities on an entity', () => {
    const INVALID_TODO_QUERY = gql`
      query {
        todos {
          id
          text
          writer {
            id
          }
        }
      }
    `;
    invalidate(store, { query: INVALID_TODO_QUERY });
    expect(console.warn).toHaveBeenCalledTimes(1);
    invalidate(store, { query: INVALID_TODO_QUERY });
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect((console.warn as any).mock.calls[0][0]).toMatch(/writer/);
  });
});

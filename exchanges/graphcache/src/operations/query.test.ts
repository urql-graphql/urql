/* eslint-disable @typescript-eslint/no-var-requires */

import { gql } from '@urql/core';
import { minifyIntrospectionQuery } from '@urql/introspection';

import { Store } from '../store';
import { write } from './write';
import { query } from './query';

const TODO_QUERY = gql`
  query Todos {
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
  let schema, store, alteredRoot;

  beforeAll(() => {
    schema = minifyIntrospectionQuery(
      require('../test-utils/simple_schema.json')
    );
    alteredRoot = minifyIntrospectionQuery(
      require('../test-utils/altered_root_schema.json')
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
  });

  it('test partial results', () => {
    const result = query(store, { query: TODO_QUERY });
    expect(result.partial).toBe(true);
    expect(result.data).toEqual({
      todos: [
        {
          id: '0',
          text: 'Teach',
          __typename: 'Todo',
          author: null,
          complete: null,
        },
        {
          id: '1',
          text: 'Learn',
          __typename: 'Todo',
          author: null,
          complete: null,
        },
      ],
    });
  });

  it('should warn once for invalid fields on an entity', () => {
    const INVALID_TODO_QUERY = gql`
      query InvalidTodo {
        todos {
          id
          text
          incomplete
        }
      }
    `;

    query(store, { query: INVALID_TODO_QUERY });
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect((console.warn as any).mock.calls[0][0]).toMatch(
      /Caused At: "InvalidTodo" query/
    );

    query(store, { query: INVALID_TODO_QUERY });
    expect(console.warn).toHaveBeenCalledTimes(1);

    expect((console.warn as any).mock.calls[0][0]).toMatch(/incomplete/);
  });

  it('should warn once for invalid sub-entities on an entity at the right stack', () => {
    const INVALID_TODO_QUERY = gql`
      query InvalidTodo {
        todos {
          ...ValidTodo
          ...InvalidFields
        }
      }

      fragment ValidTodo on Todo {
        id
        text
      }

      fragment InvalidFields on Todo {
        id
        writer {
          id
        }
      }
    `;

    query(store, { query: INVALID_TODO_QUERY });
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect((console.warn as any).mock.calls[0][0]).toMatch(
      /Caused At: "InvalidTodo" query, "InvalidFields" Fragment/
    );

    query(store, { query: INVALID_TODO_QUERY });
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect((console.warn as any).mock.calls[0][0]).toMatch(/writer/);
  });

  // Issue#64
  it('should not crash for valid queries', () => {
    const VALID_QUERY = gql`
      query getTodos {
        __typename
        todos {
          __typename
          id
          text
        }
      }
    `;
    // Use new store to ensure bug reproduction
    const store = new Store({ schema });

    let { data } = query(store, { query: VALID_QUERY });
    expect(data).toEqual(null);

    write(
      store,
      { query: VALID_QUERY },
      // @ts-ignore
      {
        // Removing typename here would formerly crash this.
        todos: [{ __typename: 'Todo', id: '0', text: 'Solve bug' }],
      }
    );
    ({ data } = query(store, { query: VALID_QUERY }));
    expect(data).toEqual({
      __typename: 'Query',
      todos: [{ __typename: 'Todo', id: '0', text: 'Solve bug' }],
    });

    // The warning should be called for `__typename`
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('should respect altered root types', () => {
    const QUERY = gql`
      query getTodos {
        __typename
        todos {
          __typename
          id
          text
        }
      }
    `;

    const store = new Store({ schema: alteredRoot });

    let { data } = query(store, { query: QUERY });
    expect(data).toEqual(null);

    write(
      store,
      { query: QUERY },
      {
        todos: [{ __typename: 'Todo', id: '0', text: 'Solve bug' }],
        __typename: 'query_root',
      }
    );

    ({ data } = query(store, { query: QUERY }));
    expect(data).toEqual({
      __typename: 'query_root',
      todos: [{ __typename: 'Todo', id: '0', text: 'Solve bug' }],
    });

    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('should not allow subsequent reads when first result was null', () => {
    const QUERY_WRITE = gql`
      query writeTodos {
        __typename
        todos {
          __typename
          ...ValidRead
        }
      }

      fragment ValidRead on Todo {
        id
      }
    `;

    const QUERY_READ = gql`
      query getTodos {
        __typename
        todos {
          __typename
          ...MissingRead
        }
        todos {
          __typename
          id
        }
      }

      fragment MissingRead on Todo {
        id
        text
      }
    `;

    const store = new Store({
      schema: alteredRoot,
    });

    let { data } = query(store, { query: QUERY_READ });
    expect(data).toEqual(null);

    write(
      store,
      { query: QUERY_WRITE },
      {
        todos: [
          {
            __typename: 'Todo',
            id: '0',
          },
        ],
        __typename: 'Query',
      }
    );

    ({ data } = query(store, { query: QUERY_READ }));
    expect(data).toEqual({
      __typename: 'query_root',
      todos: [null],
    });

    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('should not mix references', () => {
    const QUERY_WRITE = gql`
      query writeTodos {
        __typename
        todos {
          __typename
          id
          textA
          textB
        }
      }
    `;

    const QUERY_READ = gql`
      query getTodos {
        __typename
        todos {
          __typename
          id
          textA
        }
        todos {
          __typename
          textB
        }
      }
    `;

    const store = new Store({
      schema: alteredRoot,
    });

    write(
      store,
      { query: QUERY_WRITE },
      {
        todos: [
          {
            __typename: 'Todo',
            id: '0',
            textA: 'a',
            textB: 'b',
          },
        ],
        __typename: 'Query',
      }
    );

    let data: any;
    data = query(store, { query: QUERY_READ }).data;

    expect(data).toEqual({
      __typename: 'query_root',
      todos: [
        {
          __typename: 'Todo',
          id: '0',
          textA: 'a',
          textB: 'b',
        },
      ],
    });

    const previousData = {
      __typename: 'query_root',
      todos: [
        {
          __typename: 'Todo',
          id: '0',
          textA: 'a',
          textB: 'old',
        },
      ],
    };

    data = query(store, { query: QUERY_READ }, previousData).data;

    expect(data).toEqual({
      __typename: 'query_root',
      todos: [
        {
          __typename: 'Todo',
          id: '0',
          textA: 'a',
          textB: 'b',
        },
      ],
    });

    expect(previousData).toHaveProperty('todos.0.textA', 'a');
    expect(previousData).toHaveProperty('todos.0.textB', 'old');
  });

  it('should not keep references stable', () => {
    const QUERY = gql`
      query todos {
        __typename
        todos {
          __typename
          id
        }
      }
    `;

    const store = new Store({
      schema: alteredRoot,
    });

    const expected = {
      todos: [
        {
          __typename: 'Todo',
          id: '0',
        },
        {
          __typename: 'Todo',
          id: '1',
        },
        {
          __typename: 'Todo',
          id: '2',
        },
      ],
      __typename: 'query_root',
    };

    write(store, { query: QUERY }, expected);

    const prevData = {
      todos: [
        {
          __typename: 'Todo',
          id: 'prev-0',
        },
        {
          __typename: 'Todo',
          id: '1',
        },
        {
          __typename: 'Todo',
          id: '2',
        },
      ],
      __typename: 'query_root',
    };

    const data = query(store, { query: QUERY }, prevData)
      .data as typeof expected;
    expect(data).toEqual(expected);

    expect(prevData.todos[0]).not.toEqual(data.todos[0]);
    expect(prevData.todos[0]).not.toBe(data.todos[0]);
    // unchanged references:
    expect(prevData.todos[1]).toBe(data.todos[1]);
    expect(prevData.todos[2]).toBe(data.todos[2]);
  });
});

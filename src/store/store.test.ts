import gql from 'graphql-tag';
import { Store } from '.';
import { write, query } from '../operations';

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

describe('store', () => {
  let store, todosData;

  beforeEach(() => {
    store = new Store(undefined);
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

    write(store, { query: Todos }, todosData);
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
  });

  it('should resolve witha key as first argument', () => {
    const authorResult = store.resolve('Author:0', 'name');
    expect(authorResult).toBe('Jovi');
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
  });

  it('should be able to update a fragment', () => {
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

  it('should be able to update a query', () => {
    store.updateQuery(Todos, data => ({
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

    const { data: result } = query(store, { query: Todos });
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
});

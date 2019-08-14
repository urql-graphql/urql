import gql from 'graphql-tag';
import { Store } from '.';
import { write } from '../operations';

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
  let store;

  beforeAll(() => {
    store = new Store(undefined);
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
    };

    write(store, { query: Todos }, todosData);
  });

  it('Should resolve an entitty', () => {
    const todoResult = store.resolveEntity({ __typename: 'Todo', id: '0' });
    expect(todoResult.text).toEqual('Go to the shops');
    const authorResult = store.resolveEntity({ __typename: 'Author', id: '0' });
    expect(authorResult.name).toBe('Jovi');
  });

  it('Should resolve a property', () => {
    const parent = { text: 'test' };
    const result = store.resolveProperty(parent, 'text');
    expect(result).toEqual('test');
  });

  it('Should resolve a link property', () => {
    const parent = {
      id: '0',
      text: 'test',
      author: undefined,
      __typename: 'Todo',
    };
    const result = store.resolveProperty(parent, 'author');
    expect(result).toEqual({ __typename: 'Author', id: '0', name: 'Jovi' });
  });
});

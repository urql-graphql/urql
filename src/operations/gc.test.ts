import gql from 'graphql-tag';
import { Store } from '../store';
import { gc, write } from './index';

const gqlQuery = gql`
  {
    __typename
    todos {
      __typename
      id
      text
      complete
    }
    todo {
      __typename
      id
      text
      complete
      author {
        __typename
        name
      }
    }
  }
`;

it('cleans up unreachable records and links', () => {
  const store = new Store();

  write(
    store,
    { query: gqlQuery },
    {
      __typename: 'Query',
      todos: [
        {
          id: '0',
          text: 'Go to the shops',
          complete: false,
          __typename: 'Todo',
        },
        {
          id: '1',
          text: 'Pick up the kids',
          complete: true,
          __typename: 'Todo',
        },
        { id: '2', text: 'Install urql', complete: false, __typename: 'Todo' },
      ],
      todo: {
        __typename: 'Todo',
        id: '2',
        text: 'Install urql',
        complete: false,
        author: {
          __typename: 'Author',
          name: 'Thomas',
        },
      },
    }
  );

  let json = store.serialize();

  expect(json.links['Query.todos']).toEqual(['Todo:0', 'Todo:1', 'Todo:2']);
  expect(json.records['Todo:1']).toMatchObject({ __typename: 'Todo' });
  expect(json.records['Todo:2.author']).toMatchObject({ __typename: 'Author' });

  write(
    store,
    { query: gqlQuery },
    {
      __typename: 'Query',
      todos: null,
      todo: {
        __typename: 'Todo',
        id: '2',
        text: 'Install urql',
        complete: false,
        author: {
          __typename: 'Author',
          name: 'Thomas',
        },
      },
    }
  );

  json = store.serialize();

  // Same as above; everything is still reachable but `query.todos` is gone
  expect(json.records['Todo:1']).toMatchObject({ __typename: 'Todo' });
  expect(json.records['Todo:2.author']).toMatchObject({ __typename: 'Author' });

  gc(store);
  json = store.serialize();

  expect(json).toMatchSnapshot();
  expect(json.records['Todo:1']).toBe(undefined);
  expect(json.records['Todo:2']).not.toBe(undefined);
  expect(json.records['Todo:2.author']).toMatchObject({ __typename: 'Author' });

  // Remove all results
  write(
    store,
    { query: gqlQuery },
    {
      __typename: 'Query',
      todos: null,
      todo: null,
    }
  );

  gc(store);
  json = store.serialize();

  expect(json).toEqual({
    records: {
      Query: {
        __typename: 'Query',
        todos: undefined,
        todo: undefined,
      },
    },
    links: {
      'Query.todo': null,
      'Query.todos': null,
    },
  });
});

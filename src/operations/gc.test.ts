import gql from 'graphql-tag';
import { create, serialize } from '../store';
import { gc, write } from './index';

const gqlQuery = gql`
  {
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
  const store = create();

  write(
    store,
    { query: gqlQuery },
    {
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

  let json = serialize(store);

  expect(json.links['query.todos']).toEqual(['Todo:0', 'Todo:1', 'Todo:2']);
  expect(json.records['Todo:1']).toMatchObject({ __typename: 'Todo' });
  expect(json.records['Todo:2.author']).toMatchObject({ __typename: 'Author' });

  write(
    store,
    { query: gqlQuery },
    {
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

  json = serialize(store);

  // Same as above; everything is still reachable but `query.todos` is gone
  expect(json.links['query.todos']).toBe(undefined);
  expect(json.records['Todo:1']).toMatchObject({ __typename: 'Todo' });
  expect(json.records['Todo:2.author']).toMatchObject({ __typename: 'Author' });

  gc(store);
  json = serialize(store);

  expect(json).toMatchSnapshot();
  expect(json.links['query.todos']).toBe(undefined);
  expect(json.records['Todo:1']).toBe(undefined);
  expect(json.records['Todo:2']).not.toBe(undefined);
  expect(json.records['Todo:2.author']).toMatchObject({ __typename: 'Author' });

  // Remove all results
  write(
    store,
    { query: gqlQuery },
    {
      todos: null,
      todo: null,
    }
  );

  gc(store);
  json = serialize(store);

  expect(json).toEqual({
    records: {
      query: {
        todos: null,
        todo: null,
      },
    },
    links: {},
  });
});

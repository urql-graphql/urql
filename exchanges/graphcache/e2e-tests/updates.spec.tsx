import * as React from 'react';
import { executeExchange } from '@urql/exchange-execute';
import { buildSchema } from 'graphql';
import { mount } from '@cypress/react';

import {
  Provider,
  createClient,
  gql,
  useQuery,
  useMutation,
  dedupExchange,
  debugExchange,
} from 'urql';

import { cacheExchange } from '../src';

const schema = buildSchema(`
  type Todo {
    id: ID!
    text: String!
  }

  type Query {
    todos: [Todo]!
  }

  type Mutation {
    updateTodo(id: ID! text: String!): Todo!
  }
`);

const todos: Array<{ id: string; text: string }> = [
  { id: '1', text: 'testing urql' },
];

const rootValue = {
  todos: () => {
    return todos;
  },
  updateTodo: args => {
    const todo = todos.find(x => x.id === args.id);
    if (!todo) throw new Error("Can't find todo!");
    todo.text = args.text;
    return todo;
  },
};

describe('Graphcache updates', () => {
  let client;
  beforeEach(() => {
    client = createClient({
      url: 'https://trygql.formidable.dev/graphql/basic-pokedex',
      exchanges: [
        dedupExchange,
        cacheExchange({}),
        debugExchange,
        executeExchange({ schema, rootValue }),
      ],
    });
  });

  const TodosQuery = gql`
    query {
      todos {
        id
        text
      }
    }
  `;

  const UpdateMutation = gql`
    mutation ($id: ID!, $text: String!) {
      updateTodo(id: $id, text: $text) {
        id
        text
      }
    }
  `;

  it('Can automatically update entities who have been queried', () => {
    const Todos = () => {
      const [result] = useQuery({ query: TodosQuery });
      const [, update] = useMutation(UpdateMutation);

      if (result.fetching) return <p>Loading...</p>;

      return (
        <main>
          <ul id="todos-list">
            {result.data.todos.map(todo => (
              <li key={todo.id}>
                {todo.text}
                <button
                  id={`update-${todo.id}`}
                  onClick={() => {
                    update({ id: todo.id, text: todo.text + '_foo' });
                  }}
                >
                  Update {todo.id}
                </button>
              </li>
            ))}
          </ul>
        </main>
      );
    };

    mount(
      <Provider value={client}>
        <Todos />
      </Provider>
    );

    const target = { ...todos[0] };
    cy.get('#todos-list > li').then(items => {
      expect(items.length).to.equal(todos.length);
    });
    cy.get('#update-' + target.id).click();

    cy.wait(500);
    cy.get('#todos-list > li').then(items => {
      expect(items.length).to.equal(todos.length);
      expect(items[0].innerText).to.contain(target.text + '_foo');
    });
  });
});

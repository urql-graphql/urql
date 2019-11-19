import { makeFragmentsFromQuery, addFragmentsToQuery } from './populate';
import {
  buildSchema,
  print,
  FragmentDefinitionNode,
  visit,
  SelectionSetNode,
} from 'graphql';
import gql from 'graphql-tag';

const schemaDef = `
  type User {
    id: ID!
    name: String!
    age: Int!
  }

  type Todo {
    id: ID!
    text: String!
    creator: User!
  }

  type Query {
    todos: [Todo]
  }

  type Mutation {
    addTodo: [Todo]
  }
`;

const query = gql`
  query {
    todos {
      id
      name
      creator {
        id
      }
    }
  }

  fragment TodoFragment on Todo {
    id
  }
`;

const schema = buildSchema(schemaDef);

describe('makeFragmentsFromQuery', () => {
  const arg = {
    schema,
    query,
  };

  describe('new selections', () => {
    it('are created', () => {
      const r = makeFragmentsFromQuery(arg);
      expect(r.selections.length).toBe(2);
      expect(r).toMatchSnapshot();
    });
  });

  describe('user declared fragments', () => {
    it('are extracted', () => {
      const r = makeFragmentsFromQuery(arg);
      expect(
        r.fragments.filter(f => f.name.value === 'TodoFragment')
      ).toHaveLength(1);
    });
  });
});

describe('addFragmentsToQuery', () => {
  const mutation = gql`
    mutation MyMutation {
      addTodo @populate
    }
  `;

  const arg = {
    schema,
    query: mutation,
    selections: {
      Todo: [
        {
          key: 1234,
          selection:
            query.definitions[0].selectionSet.selections[0].selectionSet,
          type: 'Todo',
        },
      ],
    },
    fragments: {
      MyFragment: gql`
        fragment MyFragment on User {
          id
          name
        }
      `.definitions[0],
    },
  };

  it('returns result matching snapshot', () => {
    const q = addFragmentsToQuery(arg);
    expect(print(q)).toMatchInlineSnapshot(`
      "mutation MyMutation {
        addTodo {
          ... on Todo {
            id
            name
            creator {
              id
            }
          }
        }
      }

      fragment MyFragment on User {
        id
        name
      }
      "
    `);
  });

  describe('user provided fragments', () => {
    it('are added to query', () => {
      const r = addFragmentsToQuery(arg);

      let fragmentDefs: FragmentDefinitionNode[] = [];
      visit(r, {
        FragmentDefinition: node => {
          fragmentDefs = [...fragmentDefs, node];
        },
      });

      expect(
        fragmentDefs.filter(d => d.name.value === 'MyFragment')
      ).toHaveLength(1);
    });
  });

  describe('new selection sets', () => {
    it('are added to query', () => {
      const r = addFragmentsToQuery(arg);

      let selelctionSets: SelectionSetNode[] = [];
      visit(r, {
        SelectionSet: node => {
          selelctionSets = [...selelctionSets, node];
        },
      });

      expect(
        selelctionSets.filter(s => s === arg.selections.Todo[0].selection)
      ).toHaveLength(1);
    });
  });
});

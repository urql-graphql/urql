import { makeFragmentsFromQuery, addFragmentsToQuery } from './mutateBody';
import {
  introspectionFromSchema,
  buildSchema,
  print,
  visit,
  FragmentDefinitionNode,
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

const schema = introspectionFromSchema(buildSchema(schemaDef));

describe('makeFragmentsFromQuery', () => {
  const arg = {
    schema,
    query,
    fragmentMap: {
      _fragments: [
        gql`
          fragment MyFragment on User {
            id
            name
          }
        `.definitions[0],
      ],
    },
  };

  describe('new fragments', () => {
    it('are created', () => {
      const r = makeFragmentsFromQuery(arg);
      expect(r.Todo.length).toBe(1);
      expect(r).toMatchSnapshot();
    });
  });

  describe('user declared fragments', () => {
    it('are extracted', () => {
      const r = makeFragmentsFromQuery(arg);
      expect(
        (r._fragments as any[]).filter(f => f.name.value === 'TodoFragment')
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

  const fragmentMap = {
    Todo: [query.definitions[0].selectionSet.selections[0].selectionSet],
    _fragments: [
      gql`
        fragment MyFragment on User {
          id
          name
        }
      `,
    ],
  } as any;

  const arg = {
    schema,
    query: mutation,
    fragmentMap,
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
        selelctionSets.filter(s => s === fragmentMap.Todo[0])
      ).toHaveLength(1);
    });
  });
});

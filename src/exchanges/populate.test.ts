import { extractSelectionsFromQuery, addFragmentsToQuery } from './populate';
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
      const r = extractSelectionsFromQuery(arg);
      expect(r.selections.length).toBe(2);
      expect(r).toMatchSnapshot();
    });
  });

  describe('user declared fragments', () => {
    it('are extracted', () => {
      const r = extractSelectionsFromQuery(arg);
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
    typeFragments: {
      Todo: [
        {
          key: 1234,
          fragment: gql`
            fragment Type_PopulateFragment_0 on Todo {
              id
            }
          `.definitions[0],
          type: 'Todo',
        },
      ],
    },
    userFragments: {
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
          ...Type_PopulateFragment_0
        }
      }

      fragment Type_PopulateFragment_0 on Todo {
        id
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

  describe('new type fragments', () => {
    it('are added to query', () => {
      const r = addFragmentsToQuery(arg);

      let addedFragments: FragmentDefinitionNode[] = [];
      visit(r, {
        FragmentDefinition: node => {
          addedFragments = [...addedFragments, node];
        },
      });

      expect(
        addedFragments.filter(s => s === arg.typeFragments.Todo[0].fragment)
      ).toHaveLength(1);
    });

    describe('on empty', () => {
      it('typename is returned', () => {
        const r = addFragmentsToQuery({ ...arg, typeFragments: {} });
        expect(print(r)).toMatchInlineSnapshot(`
          "mutation MyMutation {
            addTodo {
              __typename
            }
          }

          fragment MyFragment on User {
            id
            name
          }
          "
        `);
      });
    });
  });
});

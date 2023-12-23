import {
  buildSchema,
  print,
  introspectionFromSchema,
  visit,
  DocumentNode,
  ASTKindToNode,
  Kind,
} from 'graphql';
import { vi, expect, it, describe } from 'vitest';

import { fromValue, pipe, fromArray, toArray } from 'wonka';
import {
  gql,
  Client,
  Operation,
  OperationContext,
  makeOperation,
} from '@urql/core';

import { populateExchange } from './populateExchange';

const schemaDef = `
  interface Node {
    id: ID!
  }

  type User implements Node {
    id: ID!
    name: String!
    age: Int!
    todos: [Todo]
  }

  type Todo implements Node {
    id: ID!
    text: String!
    createdAt(timezone: String): String!
    creator: User!
  }

  union UnionType = User | Todo

  interface Product {
    id: ID!
    name: String!
    price: Int!
  }

  interface Store {
    id: ID!
    name: String!
  }

  type PhysicalStore implements Store {
    id: ID!
    name: String!
    address: String
  }

  type OnlineStore implements Store {
    id: ID!
    name: String!
    website: String
  }

  type SimpleProduct implements Product {
    id: ID!
    name: String!
    price: Int!
    store: PhysicalStore
  }

  type ComplexProduct implements Product {
    id: ID!
    name: String!
    price: Int!
    tax: Int!
    store: OnlineStore
  }

  type Company {
    id: String
    employees: [User]
  }

  type Query {
    todos: [Todo!]
    users: [User!]!
    products: [Product]!
    company: Company
  }

  type Mutation {
    addTodo: [Todo]
    removeTodo: [Node]
    updateTodo: [UnionType]
    addProduct: Product
    removeCompany: Company
  }
`;

const context = {} as OperationContext;

const getNodesByType = <T extends keyof ASTKindToNode, N = ASTKindToNode[T]>(
  query: DocumentNode,
  type: T
) => {
  let result: N[] = [];

  visit(query, {
    [type]: n => {
      result = [...result, n];
    },
  });
  return result;
};

const schema = introspectionFromSchema(buildSchema(schemaDef));

const exchangeArgs = {
  forward: a => a as any,
  client: {} as Client,
  dispatchDebug: vi.fn(),
};

describe('on mutation', () => {
  const operation = makeOperation(
    'mutation',
    {
      key: 1234,
      variables: undefined,
      query: gql`
        mutation MyMutation {
          addTodo @populate
        }
      `,
    },
    context
  );

  describe('mutation query', () => {
    it('matches snapshot', async () => {
      const response = pipe<Operation, any, Operation[]>(
        fromValue(operation),
        populateExchange({ schema })(exchangeArgs),
        toArray
      );
      expect(print(response[0].query)).toMatchInlineSnapshot(`
        "mutation MyMutation {
          addTodo {
            __typename
          }
        }"
      `);
    });
  });
});

describe('on query -> mutation', () => {
  const queryOp = makeOperation(
    'query',
    {
      key: 1234,
      variables: undefined,
      query: gql`
        query {
          todos {
            id
            text
            creator {
              id
              name
            }
          }
          users {
            todos {
              text
            }
          }
        }
      `,
    },
    context
  );

  const mutationOp = makeOperation(
    'mutation',
    {
      key: 5678,
      variables: undefined,
      query: gql`
        mutation MyMutation {
          addTodo @populate
        }
      `,
    },
    context
  );

  describe('mutation query', () => {
    it('matches snapshot', async () => {
      const response = pipe<Operation, any, Operation[]>(
        fromArray([queryOp, mutationOp]),
        populateExchange({ schema })(exchangeArgs),
        toArray
      );

      expect(print(response[1].query)).toMatchInlineSnapshot(`
        "mutation MyMutation {
          addTodo {
            __typename
            id
            text
            creator {
              __typename
              id
              name
            }
          }
        }"
      `);
    });
  });
});

describe('on query -> mutation', () => {
  const queryOp = makeOperation(
    'query',
    {
      key: 1234,
      variables: undefined,
      query: gql`
        query {
          todos {
            id
            text
            createdAt(timezone: "GMT+1")
          }
        }
      `,
    },
    context
  );

  const mutationOp = makeOperation(
    'mutation',
    {
      key: 5678,
      variables: undefined,
      query: gql`
        mutation MyMutation {
          addTodo @populate
        }
      `,
    },
    context
  );

  describe('mutation query', () => {
    it('matches snapshot', async () => {
      const response = pipe<Operation, any, Operation[]>(
        fromArray([queryOp, mutationOp]),
        populateExchange({ schema })(exchangeArgs),
        toArray
      );

      expect(print(response[1].query)).toMatchInlineSnapshot(`
        "mutation MyMutation {
          addTodo {
            __typename
            id
            text
            createdAt_0: createdAt(timezone: \\"GMT+1\\")
          }
        }"
      `);
    });
  });
});

describe('on query -> mutation', () => {
  const queryOp = makeOperation(
    'query',
    {
      key: 1234,
      variables: undefined,
      query: gql`
        query {
          todos {
            id
            text
            gmt: createdAt(timezone: "GMT+1")
            utc: createdAt(timezone: "UTC")
          }
        }
      `,
    },
    context
  );

  const mutationOp = makeOperation(
    'mutation',
    {
      key: 5678,
      variables: undefined,
      query: gql`
        mutation MyMutation {
          addTodo @populate
        }
      `,
    },
    context
  );

  describe('mutation query', () => {
    it('matches snapshot', async () => {
      const response = pipe<Operation, any, Operation[]>(
        fromArray([queryOp, mutationOp]),
        populateExchange({ schema })(exchangeArgs),
        toArray
      );

      expect(print(response[1].query)).toMatchInlineSnapshot(`
        "mutation MyMutation {
          addTodo {
            __typename
            id
            text
            createdAt_0: createdAt(timezone: \\"GMT+1\\")
            createdAt_1: createdAt(timezone: \\"UTC\\")
          }
        }"
      `);
    });
  });
});

describe('on (query w/ fragment) -> mutation', () => {
  const queryOp = makeOperation(
    'query',
    {
      key: 1234,
      variables: undefined,
      query: gql`
        query {
          todos {
            ...TodoFragment
            creator {
              ...CreatorFragment
            }
          }
        }

        fragment TodoFragment on Todo {
          id
          text
        }

        fragment CreatorFragment on User {
          id
          name
        }
      `,
    },
    context
  );

  const mutationOp = makeOperation(
    'mutation',
    {
      key: 5678,
      variables: undefined,
      query: gql`
        mutation MyMutation {
          addTodo @populate {
            ...TodoFragment
          }
        }

        fragment TodoFragment on Todo {
          id
          text
        }
      `,
    },
    context
  );

  describe('mutation query', () => {
    it('matches snapshot', async () => {
      const response = pipe<Operation, any, Operation[]>(
        fromArray([queryOp, mutationOp]),
        populateExchange({ schema })(exchangeArgs),
        toArray
      );

      expect(print(response[1].query)).toMatchInlineSnapshot(`
        "mutation MyMutation {
          addTodo {
            ...TodoFragment
            __typename
            id
            text
            creator {
              __typename
              id
              name
            }
          }
        }

        fragment TodoFragment on Todo {
          id
          text
        }"
      `);
    });
  });
});

describe('on (query w/ unused fragment) -> mutation', () => {
  const queryOp = makeOperation(
    'query',
    {
      key: 1234,
      variables: undefined,
      query: gql`
        query {
          todos {
            id
            text
          }
          users {
            ...UserFragment
          }
        }

        fragment UserFragment on User {
          id
          name
        }
      `,
    },
    context
  );

  const mutationOp = makeOperation(
    'mutation',
    {
      key: 5678,
      variables: undefined,
      query: gql`
        mutation MyMutation {
          addTodo @populate
        }
      `,
    },
    context
  );

  describe('mutation query', () => {
    it('matches snapshot', async () => {
      const response = pipe<Operation, any, Operation[]>(
        fromArray([queryOp, mutationOp]),
        populateExchange({ schema })(exchangeArgs),
        toArray
      );

      expect(print(response[1].query)).toMatchInlineSnapshot(`
        "mutation MyMutation {
          addTodo {
            __typename
            id
            text
          }
        }"
      `);
    });

    it('excludes user fragment', () => {
      const response = pipe<Operation, any, Operation[]>(
        fromArray([queryOp, mutationOp]),
        populateExchange({ schema })(exchangeArgs),
        toArray
      );

      const fragments = getNodesByType(
        response[1].query,
        Kind.FRAGMENT_DEFINITION
      );
      expect(
        fragments.filter(f => 'name' in f && f.name.value === 'UserFragment')
      ).toHaveLength(0);
    });
  });
});

describe('on query -> (mutation w/ interface return type)', () => {
  const queryOp = makeOperation(
    'query',
    {
      key: 1234,
      variables: undefined,
      query: gql`
        query {
          todos {
            id
            name
          }
          users {
            id
            text
          }
        }
      `,
    },
    context
  );

  const mutationOp = makeOperation(
    'mutation',
    {
      key: 5678,
      variables: undefined,
      query: gql`
        mutation MyMutation {
          removeTodo @populate
        }
      `,
    },
    context
  );

  describe('mutation query', () => {
    it('matches snapshot', async () => {
      const response = pipe<Operation, any, Operation[]>(
        fromArray([queryOp, mutationOp]),
        populateExchange({ schema })(exchangeArgs),
        toArray
      );

      expect(print(response[1].query)).toMatchInlineSnapshot(`
        "mutation MyMutation {
          removeTodo {
            ... on User {
              __typename
              id
            }
            ... on Todo {
              __typename
              id
            }
          }
        }"
      `);
    });
  });
});

describe('on query -> (mutation w/ union return type)', () => {
  const queryOp = makeOperation(
    'query',
    {
      key: 1234,
      variables: undefined,
      query: gql`
        query {
          todos {
            id
            text
          }
          users {
            id
            name
          }
        }
      `,
    },
    context
  );

  const mutationOp = makeOperation(
    'mutation',
    {
      key: 5678,
      variables: undefined,
      query: gql`
        mutation MyMutation {
          updateTodo @populate
        }
      `,
    },
    context
  );

  describe('mutation query', () => {
    it('matches snapshot', async () => {
      const response = pipe<Operation, any, Operation[]>(
        fromArray([queryOp, mutationOp]),
        populateExchange({ schema })(exchangeArgs),
        toArray
      );

      expect(print(response[1].query)).toMatchInlineSnapshot(`
        "mutation MyMutation {
          updateTodo {
            ... on User {
              __typename
              id
              name
            }
            ... on Todo {
              __typename
              id
              text
            }
          }
        }"
      `);
    });
  });
});

// TODO: figure out how to behave with teardown, just removing and
// not requesting fields feels kinda incorrect as we would start having
// stale cache values here
describe.skip('on query -> teardown -> mutation', () => {
  const queryOp = makeOperation(
    'query',
    {
      key: 1234,
      variables: undefined,
      query: gql`
        query {
          todos {
            id
            text
          }
        }
      `,
    },
    context
  );

  const teardownOp = makeOperation('teardown', queryOp, context);

  const mutationOp = makeOperation(
    'mutation',
    {
      key: 5678,
      variables: undefined,
      query: gql`
        mutation MyMutation {
          addTodo @populate
        }
      `,
    },
    context
  );

  describe('mutation query', () => {
    it('matches snapshot', async () => {
      const response = pipe<Operation, any, Operation[]>(
        fromArray([queryOp, teardownOp, mutationOp]),
        populateExchange({ schema })(exchangeArgs),
        toArray
      );

      expect(print(response[2].query)).toMatchInlineSnapshot(`
        "mutation MyMutation {
          addTodo {
            __typename
          }
        }"
      `);
    });

    it('only requests __typename', () => {
      const response = pipe<Operation, any, Operation[]>(
        fromArray([queryOp, teardownOp, mutationOp]),
        populateExchange({ schema })(exchangeArgs),
        toArray
      );
      getNodesByType(response[2].query, Kind.FIELD).forEach(field => {
        expect((field as any).name.value).toMatch(/addTodo|__typename/);
      });
    });
  });
});

describe('interface returned in mutation', () => {
  const queryOp = makeOperation(
    'query',
    {
      key: 1234,
      variables: undefined,
      query: gql`
        query {
          products {
            id
            text
            price
            tax
          }
        }
      `,
    },
    context
  );

  const mutationOp = makeOperation(
    'mutation',
    {
      key: 5678,
      variables: undefined,
      query: gql`
        mutation MyMutation {
          addProduct @populate
        }
      `,
    },
    context
  );

  it('should correctly make the inline-fragments', () => {
    const response = pipe<Operation, any, Operation[]>(
      fromArray([queryOp, mutationOp]),
      populateExchange({ schema })(exchangeArgs),
      toArray
    );

    expect(print(response[1].query)).toMatchInlineSnapshot(`
      "mutation MyMutation {
        addProduct {
          ... on SimpleProduct {
            __typename
            id
            price
          }
          ... on ComplexProduct {
            __typename
            id
            price
            tax
          }
        }
      }"
    `);
  });
});

describe('nested interfaces', () => {
  const queryOp = makeOperation(
    'query',
    {
      key: 1234,
      variables: undefined,
      query: gql`
        query {
          products {
            id
            text
            price
            tax
            store {
              id
              name
              address
              website
            }
          }
        }
      `,
    },
    context
  );

  const mutationOp = makeOperation(
    'mutation',
    {
      key: 5678,
      variables: undefined,
      query: gql`
        mutation MyMutation {
          addProduct @populate
        }
      `,
    },
    context
  );

  it('should correctly make the inline-fragments', () => {
    const response = pipe<Operation, any, Operation[]>(
      fromArray([queryOp, mutationOp]),
      populateExchange({ schema })(exchangeArgs),
      toArray
    );

    expect(print(response[1].query)).toMatchInlineSnapshot(`
      "mutation MyMutation {
        addProduct {
          ... on SimpleProduct {
            __typename
            id
            price
            store {
              __typename
              id
              name
              address
            }
          }
          ... on ComplexProduct {
            __typename
            id
            price
            tax
            store {
              __typename
              id
              name
              website
            }
          }
        }
      }"
    `);
  });
});

describe('nested fragment', () => {
  const fragment = gql`
    fragment TodoFragment on Todo {
      id
      author {
        id
      }
    }
  `;

  const queryOp = makeOperation(
    'query',
    {
      key: 1234,
      variables: undefined,
      query: gql`
        query {
          todos {
            ...TodoFragment
          }
        }
        ${fragment}
      `,
    },
    context
  );

  const mutationOp = makeOperation(
    'mutation',
    {
      key: 5678,
      variables: undefined,
      query: gql`
        mutation MyMutation {
          updateTodo @populate
        }
      `,
    },
    context
  );

  it('should work with nested fragments', () => {
    const response = pipe<Operation, any, Operation[]>(
      fromArray([queryOp, mutationOp]),
      populateExchange({ schema })(exchangeArgs),
      toArray
    );

    expect(print(response[1].query)).toMatchInlineSnapshot(`
      "mutation MyMutation {
        updateTodo {
          ... on Todo {
            __typename
            id
          }
        }
      }"
    `);
  });
});

describe('respects max-depth', () => {
  const queryOp = makeOperation(
    'query',
    {
      key: 1234,
      variables: undefined,
      query: gql`
        query {
          company {
            id
            employees {
              id
              todos {
                id
              }
            }
          }
        }
      `,
    },
    context
  );

  const mutationOp = makeOperation(
    'mutation',
    {
      key: 5678,
      variables: undefined,
      query: gql`
        mutation MyMutation {
          removeCompany @populate
        }
      `,
    },
    context
  );

  describe('mutation query', () => {
    it('matches snapshot', async () => {
      const response = pipe<Operation, any, Operation[]>(
        fromArray([queryOp, mutationOp]),
        populateExchange({ schema, options: { maxDepth: 1 } })(exchangeArgs),
        toArray
      );

      expect(print(response[1].query)).toMatchInlineSnapshot(`
        "mutation MyMutation {
          removeCompany {
            __typename
            id
            employees {
              __typename
              id
            }
          }
        }"
      `);
    });

    it('respects skip syntax', async () => {
      const response = pipe<Operation, any, Operation[]>(
        fromArray([queryOp, mutationOp]),
        populateExchange({
          schema,
          options: { maxDepth: 1, skipType: /User/ },
        })(exchangeArgs),
        toArray
      );

      expect(print(response[1].query)).toMatchInlineSnapshot(`
        "mutation MyMutation {
          removeCompany {
            __typename
            id
            employees {
              __typename
              id
              todos {
                __typename
                id
              }
            }
          }
        }"
      `);
    });
  });
});

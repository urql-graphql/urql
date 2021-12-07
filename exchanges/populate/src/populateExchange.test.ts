import {
  buildSchema,
  print,
  introspectionFromSchema,
  visit,
  DocumentNode,
  ASTKindToNode,
  Kind,
} from 'graphql';

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

  type Query {
    todos: [Todo!]
    users: [User!]!
    products: [Product]!
  }

  type Mutation {
    addTodo: [Todo]
    removeTodo: [Node]
    updateTodo: [UnionType]
    addProduct: Product
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

beforeEach(jest.clearAllMocks);

const exchangeArgs = {
  forward: a => a as any,
  client: {} as Client,
  dispatchDebug: jest.fn(),
};

describe('on mutation', () => {
  const operation = makeOperation(
    'mutation',
    {
      key: 1234,
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
        }
        "
      `);
    });
  });
});

describe('on query -> mutation', () => {
  const queryOp = makeOperation(
    'query',
    {
      key: 1234,
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
            ...Todo_PopulateFragment_0
            ...Todo_PopulateFragment_1
          }
        }

        fragment Todo_PopulateFragment_0 on Todo {
          id
          text
          creator {
            id
            name
          }
        }

        fragment Todo_PopulateFragment_1 on Todo {
          text
        }
        "
      `);
    });
  });
});

describe('on (query w/ fragment) -> mutation', () => {
  const queryOp = makeOperation(
    'query',
    {
      key: 1234,
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
            ...Todo_PopulateFragment_0
            ...TodoFragment
          }
        }

        fragment TodoFragment on Todo {
          id
          text
        }

        fragment Todo_PopulateFragment_0 on Todo {
          ...TodoFragment
          creator {
            ...CreatorFragment
          }
        }

        fragment CreatorFragment on User {
          id
          name
        }
        "
      `);
    });

    it('includes user fragment', () => {
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
        fragments.filter(f => 'name' in f && f.name.value === 'TodoFragment')
      ).toHaveLength(1);
    });
  });
});

describe('on (query w/ unused fragment) -> mutation', () => {
  const queryOp = makeOperation(
    'query',
    {
      key: 1234,
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
            ...Todo_PopulateFragment_0
          }
        }

        fragment Todo_PopulateFragment_0 on Todo {
          id
          text
        }
        "
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
            ...User_PopulateFragment_0
            ...Todo_PopulateFragment_0
          }
        }

        fragment User_PopulateFragment_0 on User {
          id
          text
        }

        fragment Todo_PopulateFragment_0 on Todo {
          id
          name
        }
        "
      `);
    });
  });
});

describe('on query -> (mutation w/ union return type)', () => {
  const queryOp = makeOperation(
    'query',
    {
      key: 1234,
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
            ...User_PopulateFragment_0
            ...Todo_PopulateFragment_0
          }
        }

        fragment User_PopulateFragment_0 on User {
          id
          text
        }

        fragment Todo_PopulateFragment_0 on Todo {
          id
          name
        }
        "
      `);
    });
  });
});

describe('on query -> teardown -> mutation', () => {
  const queryOp = makeOperation(
    'query',
    {
      key: 1234,
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
        }
        "
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
          ...SimpleProduct_PopulateFragment_0
          ...ComplexProduct_PopulateFragment_0
        }
      }

      fragment SimpleProduct_PopulateFragment_0 on SimpleProduct {
        id
        price
      }

      fragment ComplexProduct_PopulateFragment_0 on ComplexProduct {
        id
        price
        tax
      }
      "
    `);
  });
});

describe('nested interfaces', () => {
  const queryOp = makeOperation(
    'query',
    {
      key: 1234,
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
          ...SimpleProduct_PopulateFragment_0
          ...ComplexProduct_PopulateFragment_0
        }
      }

      fragment SimpleProduct_PopulateFragment_0 on SimpleProduct {
        id
        price
        store {
          id
          name
          address
        }
      }

      fragment ComplexProduct_PopulateFragment_0 on ComplexProduct {
        id
        price
        tax
        store {
          id
          name
          website
        }
      }
      "
    `);
  });
});

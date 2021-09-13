import {
  buildSchema,
  print,
  introspectionFromSchema,
  visit,
  DocumentNode,
  ASTKindToNode,
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
  forward: (a: any) => a as any,
  client: {} as Client,
  dispatchDebug: jest.fn(),
};

describe('nested fragment', () => {
  const fragment = gql`
    fragment TodoFragment on Todo {
      id
      creator {
        id
      }
    }
  `;

  const queryOp = makeOperation(
    'query',
    {
      key: 1234,
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
      query: gql`
        mutation MyMutation {
          addTodo @populate
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

    expect(print(response[1].query)).toBe(`mutation MyMutation {
  addTodo {
    id
    creator {
      id
    }
  }
}
`);
  });
});

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
    it('Only adds __typename if there are no queries to infer fields', async () => {
      const response = pipe<Operation, any, Operation[]>(
        fromValue(operation),
        populateExchange({ schema })(exchangeArgs),
        toArray
      );
      expect(print(response[0].query)).toBe(`mutation MyMutation {
  addTodo {
    __typename
  }
}
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
    it('Populate mutation with fields required to update previous queries', async () => {
      const response = pipe<Operation, any, Operation[]>(
        fromArray([queryOp, mutationOp]),
        populateExchange({ schema })(exchangeArgs),
        toArray
      );

      expect(print(response[1].query)).toBe(`mutation MyMutation {
  addTodo {
    id
    text
    creator {
      id
      name
    }
  }
}
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

      expect(print(response[1].query)).toBe(`mutation MyMutation {
  addTodo {
    id
    text
    creator {
      id
      name
    }
    ...TodoFragment
  }
}

fragment TodoFragment on Todo {
  id
  text
}
`);
    });

    it('includes user fragment', () => {
      const response = pipe<Operation, any, Operation[]>(
        fromArray([queryOp, mutationOp]),
        populateExchange({ schema })(exchangeArgs),
        toArray
      );

      const fragments = getNodesByType(response[1].query, 'FragmentDefinition');
      expect(
        fragments.filter(f => f.name.value === 'TodoFragment')
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

      expect(print(response[1].query)).toBe(`mutation MyMutation {
  addTodo {
    id
    text
  }
}
`);
    });

    it('excludes user fragment', () => {
      const response = pipe<Operation, any, Operation[]>(
        fromArray([queryOp, mutationOp]),
        populateExchange({ schema })(exchangeArgs),
        toArray
      );

      const fragments = getNodesByType(response[1].query, 'FragmentDefinition');
      expect(
        fragments.filter(f => f.name.value === 'UserFragment')
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

      expect(print(response[1].query)).toBe(`mutation MyMutation {
  removeTodo {
    ...User_PopulateFragment_0
    ...Todo_PopulateFragment_0
  }
}

fragment User_PopulateFragment_0 on User {
  id
  name
}

fragment Todo_PopulateFragment_0 on Todo {
  id
  text
}
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

      expect(print(response[1].query)).toBe(`mutation MyMutation {
  updateTodo {
    ...User_PopulateFragment_0
    ...Todo_PopulateFragment_0
  }
}

fragment User_PopulateFragment_0 on User {
  id
  name
}

fragment Todo_PopulateFragment_0 on Todo {
  id
  text
}
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

      expect(print(response[2].query)).toBe(`mutation MyMutation {
  addTodo {
    id
    text
  }
}
`);
    });

    /*it("only requests __typename", () => {
      const response = pipe<Operation, any, Operation[]>(
        fromArray([queryOp, teardownOp, mutationOp]),
        populateExchange({ schema })(exchangeArgs),
        toArray
      );
      getNodesByType(response[2].query, "Field").forEach((field) => {
        expect(field.name.value).toMatch(/addTodo|__typename/);
      });
    });*/
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
            name
            price
            ... on ComplexProduct {
              tax
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

    expect(print(response[1].query)).toBe(`mutation MyMutation {
  addProduct {
    ...SimpleProduct_PopulateFragment_0
    ...ComplexProduct_PopulateFragment_0
  }
}

fragment SimpleProduct_PopulateFragment_0 on SimpleProduct {
  id
  name
  price
}

fragment ComplexProduct_PopulateFragment_0 on ComplexProduct {
  id
  name
  price
  tax
}
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
            name
            price
            ... on ComplexProduct {
              tax
              store {
                id
                name
                website
              }
            }
            ... on SimpleProduct {
              store {
                id
                name
                address
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

    expect(print(response[1].query)).toBe(`mutation MyMutation {
  addProduct {
    ...SimpleProduct_PopulateFragment_0
    ...ComplexProduct_PopulateFragment_0
  }
}

fragment SimpleProduct_PopulateFragment_0 on SimpleProduct {
  id
  name
  price
  store {
    id
    name
    address
  }
}

fragment ComplexProduct_PopulateFragment_0 on ComplexProduct {
  id
  name
  price
  tax
  store {
    id
    name
    website
  }
}
`);
  });
});

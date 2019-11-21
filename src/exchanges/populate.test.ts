import { populateExchange } from './populate';
import {
  buildSchema,
  print,
  introspectionFromSchema,
  visit,
  DocumentNode,
  ASTKindToNode,
} from 'graphql';
import gql from 'graphql-tag';
import { fromValue, pipe, fromArray, toArray } from 'wonka';
import { Operation } from 'src/types';
import { Client } from 'src/client';

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

  type Query {
    todos: [Todo]
    users: [User]
  }

  type Mutation {
    addTodo: [Todo]
    removeTodo: [Node]
    updateTodo: [UnionType]
  }
`;

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
};

describe('on mutation', () => {
  const operation = {
    key: 1234,
    operationName: 'mutation',
    query: gql`
      mutation MyMutation {
        addTodo @populate
      }
    `,
  } as Operation;

  describe('mutation query', () => {
    it('matches snapshot', async () => {
      const response = pipe<Operation, any, Operation[]>(
        fromValue(operation),
        populateExchange({ schema })(exchangeArgs),
        toArray
      );
      expect(print(response[0].query)).toMatchSnapshot();
    });
  });
});

describe('on query -> mutation', () => {
  const queryOp = {
    key: 1234,
    operationName: 'query',
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
  } as Operation;

  const mutationOp = {
    key: 5678,
    operationName: 'mutation',
    query: gql`
      mutation MyMutation {
        addTodo @populate
      }
    `,
  } as Operation;

  describe('mutation query', () => {
    it('matches snapshot', async () => {
      const response = pipe<Operation, any, Operation[]>(
        fromArray([queryOp, mutationOp]),
        populateExchange({ schema })(exchangeArgs),
        toArray
      );

      expect(print(response[1].query)).toMatchSnapshot();
    });
  });
});

describe('on (query w/ fragment) -> mutation', () => {
  const queryOp = {
    key: 1234,
    operationName: 'query',
    query: gql`
      query {
        todos {
          ...TodoFragment
        }
      }

      fragment TodoFragment on Todo {
        id
        text
      }
    `,
  } as Operation;

  const mutationOp = {
    key: 5678,
    operationName: 'mutation',
    query: gql`
      mutation MyMutation {
        addTodo @populate
      }
    `,
  } as Operation;

  describe('mutation query', () => {
    it('matches snapshot', async () => {
      const response = pipe<Operation, any, Operation[]>(
        fromArray([queryOp, mutationOp]),
        populateExchange({ schema })(exchangeArgs),
        toArray
      );

      expect(print(response[1].query)).toMatchSnapshot();
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
  const queryOp = {
    key: 1234,
    operationName: 'query',
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
  } as Operation;

  const mutationOp = {
    key: 5678,
    operationName: 'mutation',
    query: gql`
      mutation MyMutation {
        addTodo @populate
      }
    `,
  } as Operation;

  describe('mutation query', () => {
    it('matches snapshot', async () => {
      const response = pipe<Operation, any, Operation[]>(
        fromArray([queryOp, mutationOp]),
        populateExchange({ schema })(exchangeArgs),
        toArray
      );

      expect(print(response[1].query)).toMatchSnapshot();
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
  const queryOp = {
    key: 1234,
    operationName: 'query',
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
  } as Operation;

  const mutationOp = {
    key: 5678,
    operationName: 'mutation',
    query: gql`
      mutation MyMutation {
        removeTodo @populate
      }
    `,
  } as Operation;

  describe('mutation query', () => {
    it('matches snapshot', async () => {
      const response = pipe<Operation, any, Operation[]>(
        fromArray([queryOp, mutationOp]),
        populateExchange({ schema })(exchangeArgs),
        toArray
      );

      expect(print(response[1].query)).toMatchSnapshot();
    });
  });
});

describe('on query -> (mutation w/ union return type)', () => {
  const queryOp = {
    key: 1234,
    operationName: 'query',
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
  } as Operation;

  const mutationOp = {
    key: 5678,
    operationName: 'mutation',
    query: gql`
      mutation MyMutation {
        updateTodo @populate
      }
    `,
  } as Operation;

  describe('mutation query', () => {
    it('matches snapshot', async () => {
      const response = pipe<Operation, any, Operation[]>(
        fromArray([queryOp, mutationOp]),
        populateExchange({ schema })(exchangeArgs),
        toArray
      );

      expect(print(response[1].query)).toMatchSnapshot();
    });
  });
});

describe('on query -> teardown -> mutation', () => {
  const queryOp = {
    key: 1234,
    operationName: 'query',
    query: gql`
      query {
        todos {
          id
          text
        }
      }
    `,
  } as Operation;

  const teardownOp = {
    key: queryOp.key,
    operationName: 'teardown',
  } as Operation;

  const mutationOp = {
    key: 5678,
    operationName: 'mutation',
    query: gql`
      mutation MyMutation {
        addTodo @populate
      }
    `,
  } as Operation;

  describe('mutation query', () => {
    it('matches snapshot', async () => {
      const response = pipe<Operation, any, Operation[]>(
        fromArray([queryOp, teardownOp, mutationOp]),
        populateExchange({ schema })(exchangeArgs),
        toArray
      );

      expect(print(response[2].query)).toMatchSnapshot();
    });

    it('only requests __typename', () => {
      const response = pipe<Operation, any, Operation[]>(
        fromArray([queryOp, teardownOp, mutationOp]),
        populateExchange({ schema })(exchangeArgs),
        toArray
      );
      getNodesByType(response[2].query, 'Field').forEach(field => {
        expect(field.name.value).toMatch(/addTodo|__typename/);
      });
    });
  });
});

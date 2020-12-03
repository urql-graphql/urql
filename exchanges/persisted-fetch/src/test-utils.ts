import {
  gql,
  GraphQLRequest,
  OperationContext,
  Operation,
  makeOperation,
} from '@urql/core';

const context: OperationContext = {
  fetchOptions: {
    method: 'POST',
  },
  requestPolicy: 'cache-first',
  url: 'http://localhost:3000/graphql',
};

const queryGql: GraphQLRequest = {
  key: 2,
  query: gql`
    query getUser($name: String) {
      user(name: $name) {
        id
        firstName
        lastName
      }
    }
  `,
  variables: {
    name: 'Clara',
  },
};

export const mutationGql: GraphQLRequest = {
  key: 2,
  query: gql`
    mutation AddUser($name: String) {
      addUser(name: $name) {
        name
      }
    }
  `,
  variables: {
    name: 'Clara',
  },
};

export const queryOperation: Operation = makeOperation(
  'query',
  queryGql,
  context
);

export const mutationOperation: Operation = makeOperation(
  'mutation',
  mutationGql,
  context
);

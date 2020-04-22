import { GraphQLRequest, OperationContext, Operation } from '@urql/core';
import gql from 'graphql-tag';

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

export const queryOperation: Operation = {
  ...queryGql,
  operationName: 'query',
  context,
};

export const mutationOperation: Operation = {
  ...mutationGql,
  operationName: 'mutation',
  context,
};

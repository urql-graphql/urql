import gql from 'graphql-tag';

import {
  ExecutionResult,
  GraphQLRequest,
  Operation,
  OperationContext,
  OperationResult,
} from '../types';

const context: OperationContext = {
  fetchOptions: {
    method: 'POST',
  },
  requestPolicy: 'cache-first',
  url: 'http://localhost:3000/graphql',
};

export const queryGql: GraphQLRequest = {
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
  key: 3,
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

export const subscriptionGql: GraphQLRequest = {
  key: 4,
  query: gql`
    subscription subscribeToUser($user: String) {
      user(user: $user) {
        name
      }
    }
  `,
  variables: {
    user: 'colin',
  },
};

export const teardownOperation: Operation = {
  query: queryGql.query,
  variables: queryGql.variables,
  key: queryGql.key,
  operationName: 'teardown',
  context,
};

export const queryOperation: Operation = {
  query: teardownOperation.query,
  variables: teardownOperation.variables,
  key: teardownOperation.key,
  operationName: 'query',
  context,
};

export const mutationOperation: Operation = {
  query: mutationGql.query,
  variables: mutationGql.variables,
  key: mutationGql.key,
  operationName: 'mutation',
  context,
};

export const subscriptionOperation: Operation = {
  query: subscriptionGql.query,
  variables: subscriptionGql.variables,
  key: subscriptionGql.key,
  operationName: 'subscription',
  context,
};

export const undefinedQueryResponse: OperationResult = {
  operation: queryOperation,
};

export const queryResponse: OperationResult = {
  operation: queryOperation,
  data: {
    user: {
      name: 'Clive',
    },
  },
};

export const mutationResponse: OperationResult = {
  operation: mutationOperation,
  data: {},
};

export const subscriptionResult: ExecutionResult = {
  data: {},
};

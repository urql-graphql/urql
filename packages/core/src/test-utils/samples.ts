import { gql } from '../gql';

import {
  ExecutionResult,
  GraphQLRequest,
  Operation,
  OperationContext,
  OperationResult,
} from '../types';
import { makeOperation } from '../utils';

export const context: OperationContext = {
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

export const queryOperation: Operation = makeOperation(
  'query',
  {
    query: queryGql.query,
    variables: queryGql.variables,
    key: queryGql.key,
  },
  context
);

export const teardownOperation: Operation = makeOperation(
  'teardown',
  {
    query: queryOperation.query,
    variables: queryOperation.variables,
    key: queryOperation.key,
  },
  context
);

export const mutationOperation: Operation = makeOperation(
  'mutation',
  {
    query: mutationGql.query,
    variables: mutationGql.variables,
    key: mutationGql.key,
  },
  context
);

export const subscriptionOperation: Operation = makeOperation(
  'subscription',
  {
    query: subscriptionGql.query,
    variables: subscriptionGql.variables,
    key: subscriptionGql.key,
  },
  context
);

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

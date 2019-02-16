import { parse } from 'graphql';

import {
  ExecutionResult,
  GraphqlMutation,
  GraphqlQuery,
  GraphqlSubscription,
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

export const queryGql: GraphqlQuery = {
  query: `query getUser($name: String){
    user(name: $name) {
      id
      firstName
      lastName
    }
  }`,
  variables: {
    name: 'Clara',
  },
};

export const mutationGql: GraphqlMutation = {
  query: `mutation AddUser($name: String){
    addUser(name: $name) {
      name
    }
  }`,
  variables: {
    name: 'Clara',
  },
};

export const subscriptionGql: GraphqlSubscription = {
  query: `subscription subscribeToUser($user: String){
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
  // @ts-ignore
  query: parse(queryGql.query),
  variables: queryGql.variables,
  key: 2,
  operationName: 'teardown',
  context,
};

export const queryOperation: Operation = {
  query: teardownOperation.query,
  variables: teardownOperation.variables,
  key: 2,
  operationName: 'query',
  context,
};

export const mutationOperation: Operation = {
  // @ts-ignore
  query: parse(mutationGql.query),
  variables: mutationGql.variables,
  key: 3,
  operationName: 'mutation',
  context,
};

export const subscriptionOperation: Operation = {
  // @ts-ignore
  query: parse(subscriptionGql.query),
  variables: subscriptionGql.variables,
  key: 4,
  operationName: 'subscription',
  context,
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

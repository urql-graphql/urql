import {
  ExchangeResult,
  ExecutionResult,
  GraphqlMutation,
  GraphqlQuery,
  GraphqlSubscription,
  Operation,
} from '../types';

const context = {
  fetchOptions: {
    method: 'POST',
  },
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

export const queryOperation: Operation = {
  key: '2',
  operationName: 'query',
  context,
  ...queryGql,
};

export const mutationOperation: Operation = {
  key: JSON.stringify(mutationGql),
  operationName: 'mutation',
  context,
  ...mutationGql,
};

export const subscriptionOperation: Operation = {
  key: JSON.stringify(subscriptionGql),
  operationName: 'subscription',
  context,
  ...subscriptionGql,
};

export const queryResponse: ExchangeResult = {
  operation: queryOperation,
  data: {
    user: {
      name: 'Clive',
    },
  },
};

export const mutationResponse: ExchangeResult = {
  operation: mutationOperation,
  data: {},
};

export const subscriptionResult: ExecutionResult = {
  data: {},
};

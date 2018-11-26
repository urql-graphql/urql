import { Query, Mutation, Operation, ExchangeResult } from './types';

export const queryGql: Query = {
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

export const mutationGql: Mutation = {
  query: `mutation AddUser($name: String){
    addUser(name: $name) {
      name
    }
  }`,
  variables: {
    name: 'Clara',
  },
};

export const queryOperation: Operation = {
  key: '2',
  operationName: 'query',
  context: {},
  ...queryGql,
};

export const mutationOperation: Operation = {
  key: JSON.stringify(mutationGql),
  operationName: 'mutation',
  context: {},
  ...mutationGql,
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

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

const file = new File(['foo'], 'index.ts');

const upload: GraphQLRequest = {
  key: 3,
  query: gql`
    mutation uploadProfilePicture($picture: File) {
      uploadProfilePicture(picture: $picture) {
        location
      }
    }
  `,
  variables: {
    picture: file,
  },
};

export const uploadOperation: Operation = {
  ...upload,
  operationName: 'mutation',
  context,
};

export const queryOperation: Operation = {
  ...queryGql,
  operationName: 'query',
  context,
};

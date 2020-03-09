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

const obj = { hello: 'world' };
const file = new File(
  [new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })],
  'index.ts'
);
const files = [file, file];

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

const uploads: GraphQLRequest = {
  key: 3,
  query: gql`
    mutation uploadProfilePictures($pictures: [File]) {
      uploadProfilePicture(pictures: $pictures) {
        location
      }
    }
  `,
  variables: {
    picture: files,
  },
};

export const uploadOperation: Operation = {
  ...upload,
  operationName: 'mutation',
  context,
};

export const multipleUploadOperation: Operation = {
  ...uploads,
  operationName: 'mutation',
  context,
};

export const queryOperation: Operation = {
  ...queryGql,
  operationName: 'query',
  context,
};

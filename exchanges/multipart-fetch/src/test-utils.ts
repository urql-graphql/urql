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

export const uploadOperation: Operation = makeOperation(
  'mutation',
  upload,
  context
);

export const multipleUploadOperation: Operation = makeOperation(
  'mutation',
  uploads,
  context
);

export const queryOperation: Operation = makeOperation(
  'query',
  queryGql,
  context
);

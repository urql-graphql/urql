import { of } from 'rxjs';
import { cacheExchange } from './cache';

const queryGql = {
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

const mutationGql = {
  query: `mutation AddUser($name: String){
    addUser(name: $name) {
      name
    }
  }`,
  variables: {
    name: 'Clara',
  },
};

const queryOperation = {
  // key: JSON.stringify(queryGql),
  key: '2',
  operationName: 'query',
  options: {},
  ...queryGql,
};

const mutationOperation = {
  key: JSON.stringify(mutationGql),
  operationName: 'query',
  options: {},
  ...mutationGql,
};

const queryResponse = {
  operation: {
    key: queryOperation.key,
    operationName: 'query',
  },
  data: [],
};

const mutationResponse = {
  operation: {
    key: queryOperation.key,
    operationName: 'mutation',
  },
  data: [],
};

let exchange = cacheExchange();
const forwardMock = jest.fn();

beforeEach(() => {
  exchange = cacheExchange();
  forwardMock.mockClear();
});

it('forwards to next exchange when no cache is found', async () => {
  forwardMock.mockReturnValue(of(queryResponse));
  await exchange(forwardMock)(of(queryOperation)).toPromise();

  expect(forwardMock).toHaveBeenCalledTimes(1);
});

it('caches queries', async () => {
  forwardMock.mockReturnValue(of(queryResponse));
  await exchange(forwardMock)(of(queryOperation)).toPromise();
  await exchange(forwardMock)(of(queryOperation)).toPromise();

  expect(forwardMock).toHaveBeenCalledTimes(1);
});

it("doesn't cache mutations", async () => {
  forwardMock.mockReturnValue(of(mutationResponse));
  await exchange(forwardMock)(of(mutationOperation)).toPromise();
  await exchange(forwardMock)(of(mutationOperation)).toPromise();

  expect(forwardMock).toHaveBeenCalledTimes(2);
});

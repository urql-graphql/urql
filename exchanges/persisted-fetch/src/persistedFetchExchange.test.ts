/**
 * @jest-environment node
 */

import { empty, fromValue, fromArray, pipe, Source, toPromise } from 'wonka';

import { DocumentNode, print } from 'graphql';
import { Client, OperationResult } from '@urql/core';

import { queryOperation } from './test-utils';
import { hash } from './sha256';
import { persistedFetchExchange } from './persistedFetchExchange';

const fetch = (global as any).fetch as jest.Mock;

const exchangeArgs = {
  dispatchDebug: jest.fn(),
  forward: () => empty as Source<OperationResult>,
  client: ({
    debugTarget: {
      dispatchEvent: jest.fn(),
    },
  } as any) as Client,
};

afterEach(() => {
  fetch.mockClear();
});

it('accepts successful persisted query responses', async () => {
  const expected = {
    data: {
      test: true,
    },
  };

  fetch.mockResolvedValueOnce({
    json: () => Promise.resolve(expected),
  });

  const actual = await pipe(
    fromValue(queryOperation),
    persistedFetchExchange()(exchangeArgs),
    toPromise
  );

  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0][1].body).toMatchSnapshot();
  expect(actual.data).not.toBeUndefined();
});

it('supports cache-miss persisted query errors', async () => {
  const expectedMiss = {
    errors: [{ message: 'PersistedQueryNotFound' }],
  };

  const expectedRetry = {
    data: {
      test: true,
    },
  };

  fetch
    .mockResolvedValueOnce({
      json: () => Promise.resolve(expectedMiss),
    })
    .mockResolvedValueOnce({
      json: () => Promise.resolve(expectedRetry),
    });

  const actual = await pipe(
    fromValue(queryOperation),
    persistedFetchExchange()(exchangeArgs),
    toPromise
  );

  expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch.mock.calls[0][1].body).toMatchSnapshot();
  expect(fetch.mock.calls[1][1].body).toMatchSnapshot();
  expect(actual.data).not.toBeUndefined();
});

it('supports GET exclusively for persisted queries', async () => {
  const expectedMiss = {
    errors: [{ message: 'PersistedQueryNotFound' }],
  };

  const expectedRetry = {
    data: {
      test: true,
    },
  };

  fetch
    .mockResolvedValueOnce({
      json: () => Promise.resolve(expectedMiss),
    })
    .mockResolvedValueOnce({
      json: () => Promise.resolve(expectedRetry),
    });

  const actual = await pipe(
    fromValue(queryOperation),
    persistedFetchExchange({ preferGetForPersistedQueries: true })(
      exchangeArgs
    ),
    toPromise
  );

  expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch.mock.calls[0][1].method).toEqual('GET');
  expect(fetch.mock.calls[1][1].method).toEqual('POST');
  expect(actual.data).not.toBeUndefined();
});

it('supports unsupported persisted query errors', async () => {
  const expectedMiss = {
    errors: [{ message: 'PersistedQueryNotSupported' }],
  };

  const expectedRetry = {
    data: {
      test: true,
    },
  };

  fetch
    .mockResolvedValueOnce({
      json: () => Promise.resolve(expectedMiss),
    })
    .mockResolvedValueOnce({
      json: () => Promise.resolve(expectedRetry),
    })
    .mockResolvedValueOnce({
      json: () => Promise.resolve(expectedRetry),
    });

  const actual = await pipe(
    fromArray([queryOperation, queryOperation]),
    persistedFetchExchange()(exchangeArgs),
    toPromise
  );

  expect(fetch).toHaveBeenCalledTimes(3);
  expect(fetch.mock.calls[0][1].body).toMatchSnapshot();
  expect(fetch.mock.calls[1][1].body).toEqual(fetch.mock.calls[1][1].body);
  expect(actual.data).not.toBeUndefined();
});

it('correctly generates an SHA256 hash', async () => {
  const expected = {
    data: {
      test: true,
    },
  };

  fetch.mockResolvedValue({
    json: () => Promise.resolve(expected),
  });

  const queryHash = await hash(print(queryOperation.query));

  await pipe(
    fromValue(queryOperation),
    persistedFetchExchange()(exchangeArgs),
    toPromise
  );

  expect(fetch).toHaveBeenCalledTimes(1);

  const body = JSON.parse(fetch.mock.calls[0][1].body);

  expect(queryHash).toBe(
    'b4228e10e04c59def248546d305b710309c1b297423b38eb64f989a89a398cd8'
  );

  expect(body).toMatchObject({
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash: queryHash,
      },
    },
  });
});

it('supports a custom hash function', async () => {
  const expected = {
    data: {
      test: true,
    },
  };

  fetch.mockResolvedValueOnce({
    json: () => Promise.resolve(expected),
  });

  const hashFn = jest.fn((_input: string, _doc: DocumentNode) => {
    return Promise.resolve('hello');
  });

  await pipe(
    fromValue(queryOperation),
    persistedFetchExchange({ generateHash: hashFn })(exchangeArgs),
    toPromise
  );

  expect(fetch).toHaveBeenCalledTimes(1);

  const body = JSON.parse(fetch.mock.calls[0][1].body);

  expect(body).toMatchObject({
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash: 'hello',
      },
    },
  });
  const queryString = `query getUser($name: String) {
  user(name: $name) {
    id
    firstName
    lastName
  }
}`;
  expect(hashFn).toBeCalledWith(queryString, queryOperation.query);
});

it('falls back to a non-persisted query if the hash is falsy', async () => {
  const expected = {
    data: {
      test: true,
    },
  };

  fetch.mockResolvedValueOnce({
    json: () => Promise.resolve(expected),
  });

  const hashFn = jest.fn(() => Promise.resolve(''));

  await pipe(
    fromValue(queryOperation),
    persistedFetchExchange({ generateHash: hashFn })(exchangeArgs),
    toPromise
  );

  expect(fetch).toHaveBeenCalledTimes(1);

  const body = JSON.parse(fetch.mock.calls[0][1].body);

  expect(body).toMatchObject({
    query:
      'query getUser($name: String) {\n' +
      '  user(name: $name) {\n' +
      '    id\n' +
      '    firstName\n' +
      '    lastName\n' +
      '  }\n' +
      '}',
    operationName: 'getUser',
    variables: { name: 'Clara' },
  });
});

import gql from 'graphql-tag';

import { pipe, map, makeSubject, publish, tap } from 'wonka';

import {
  createClient,
  Operation,
  OperationResult,
  ExchangeIO,
} from '@urql/core';
import { retryExchange, OperationWithRetry } from './retryExchange';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

const mockOptions = {
  initialDelayMs: 50,
  maxDelayMs: 500,
  randomDelay: true,
  maxNumberAttempts: 10,
  retryIf: () => true,
};

const queryOne = gql`
  {
    author {
      id
      name
    }
  }
`;

const queryOneData = {
  __typename: 'Query',
  author: {
    __typename: 'Author',
    id: '123',
    name: 'Author',
  },
};

const queryOneError = {
  name: 'error',
  message: 'scary error',
};

let client, op, ops$, next;
beforeEach(() => {
  client = createClient({ url: 'http://0.0.0.0' });
  op = client.createRequestOperation('query', {
    key: 1,
    query: queryOne,
  });

  ({ source: ops$, next } = makeSubject<OperationWithRetry>());
});

it('retries if it hits an error', () => {
  const response = jest.fn(
    (forwardOp: Operation): OperationResult => {
      expect(forwardOp.key).toBe(op.key);
      return {
        operation: forwardOp,
        // @ts-ignore
        error: queryOneError,
      };
    }
  );

  const result = jest.fn();
  const forward: ExchangeIO = ops$ => {
    return pipe(ops$, map(response));
  };

  const mockRetryIf = jest.fn(() => true);
  pipe(
    retryExchange({
      ...mockOptions,
      retryIf: mockRetryIf,
    })({
      forward,
      client,
    })(ops$),
    tap(result),
    publish
  );

  next(op);
  // Once for failed results, once for successful results
  expect(mockRetryIf).toHaveBeenCalledTimes(2);
  expect(mockRetryIf).toHaveBeenCalledWith(queryOneError);

  jest.runAllTimers();

  // max number of retries, plus original call
  expect(response).toHaveBeenCalledTimes(mockOptions.maxNumberAttempts);
  expect(result).toHaveBeenCalledTimes(mockOptions.maxNumberAttempts);
});

it('should retry x number of times and then return the successful result', () => {
  const numberRetriesBeforeSuccess = 3;
  const response = jest.fn(
    (forwardOp: OperationWithRetry): OperationResult => {
      expect(forwardOp.key).toBe(op.key);
      // @ts-ignore
      return {
        operation: forwardOp,
        ...(forwardOp.retryCount! >= numberRetriesBeforeSuccess
          ? { data: queryOneData }
          : { error: queryOneError }),
      };
    }
  );

  const result = jest.fn();
  const forward: ExchangeIO = ops$ => {
    return pipe(ops$, map(response));
  };

  const mockRetryIf = jest.fn(() => true);
  pipe(
    retryExchange({
      ...mockOptions,
      retryIf: mockRetryIf,
    })({
      forward,
      client,
    })(ops$),
    tap(result),
    publish
  );

  next(op);
  jest.runAllTimers();

  expect(mockRetryIf).toHaveBeenCalledTimes(numberRetriesBeforeSuccess * 2);
  expect(mockRetryIf).toHaveBeenCalledWith(queryOneError);

  // one for original source, one for retry
  expect(response).toHaveBeenCalledTimes(1 + numberRetriesBeforeSuccess);
  expect(result).toHaveBeenCalledTimes(1 + numberRetriesBeforeSuccess);
});

it(`should still retry if retryIf undefined but there is a networkError`, () => {
  const errorWithNetworkError = {
    ...queryOneError,
    networkError: 'scary network error',
  };
  const response = jest.fn(
    (forwardOp: Operation): OperationResult => {
      expect(forwardOp.key).toBe(op.key);
      return {
        operation: forwardOp,
        // @ts-ignore
        error: errorWithNetworkError,
      };
    }
  );

  const result = jest.fn();
  const forward: ExchangeIO = ops$ => {
    return pipe(ops$, map(response));
  };

  pipe(
    retryExchange({
      ...mockOptions,
      retryIf: undefined,
    })({
      forward,
      client,
    })(ops$),
    tap(result),
    publish
  );

  next(op);

  jest.runAllTimers();

  // max number of retries, plus original call
  expect(response).toHaveBeenCalledTimes(mockOptions.maxNumberAttempts);
  expect(result).toHaveBeenCalledTimes(mockOptions.maxNumberAttempts);
});

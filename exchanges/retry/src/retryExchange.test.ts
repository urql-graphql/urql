import { pipe, map, makeSubject, publish, tap } from 'wonka';

import {
  gql,
  createClient,
  makeOperation,
  Operation,
  OperationResult,
  ExchangeIO,
} from '@urql/core';

import { retryExchange, RetryExchangeOptions } from './retryExchange';

const dispatchDebug = jest.fn();

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

  ({ source: ops$, next } = makeSubject<Operation>());
});

it(`retries if it hits an error and works for multiple concurrent operations`, () => {
  const queryTwo = gql`
    {
      films {
        id
        name
      }
    }
  `;
  const queryTwoError = {
    name: 'error2',
    message: 'scary error2',
  };
  const opTwo = client.createRequestOperation('query', {
    key: 2,
    query: queryTwo,
  });

  const response = jest.fn(
    (forwardOp: Operation): OperationResult => {
      expect(
        forwardOp.key === op.key || forwardOp.key === opTwo.key
      ).toBeTruthy();

      return {
        operation: forwardOp,
        // @ts-ignore
        error: forwardOp.key === 2 ? queryTwoError : queryOneError,
      };
    }
  );

  const result = jest.fn();
  const forward: ExchangeIO = ops$ => {
    return pipe(ops$, map(response));
  };

  const mockRetryIf = jest.fn((() => true) as RetryExchangeOptions['retryIf']);

  pipe(
    retryExchange({
      ...mockOptions,
      retryIf: mockRetryIf,
    })({
      forward,
      client,
      dispatchDebug,
    })(ops$),
    tap(result),
    publish
  );

  next(op);

  expect(mockRetryIf).toHaveBeenCalledTimes(1);
  expect(mockRetryIf).toHaveBeenCalledWith(queryOneError as any, op);

  jest.runAllTimers();

  expect(mockRetryIf).toHaveBeenCalledTimes(mockOptions.maxNumberAttempts);

  expect(response).toHaveBeenCalledTimes(mockOptions.maxNumberAttempts);

  // result should only ever be called once per operation
  expect(result).toHaveBeenCalledTimes(1);

  next(opTwo);

  jest.runAllTimers();

  expect(mockRetryIf).toHaveBeenCalledWith(queryTwoError as any, opTwo);

  // max number of retries for each op
  expect(response).toHaveBeenCalledTimes(mockOptions.maxNumberAttempts * 2);
  expect(result).toHaveBeenCalledTimes(2);
});

it('should retry x number of times and then return the successful result', () => {
  const numberRetriesBeforeSuccess = 3;
  const response = jest.fn(
    (forwardOp: Operation): OperationResult => {
      expect(forwardOp.key).toBe(op.key);
      // @ts-ignore
      return {
        operation: forwardOp,
        ...(forwardOp.context.retryCount! >= numberRetriesBeforeSuccess
          ? { data: queryOneData }
          : { error: queryOneError }),
      };
    }
  );

  const result = jest.fn();
  const forward: ExchangeIO = ops$ => {
    return pipe(ops$, map(response));
  };

  const mockRetryIf = jest.fn((() => true) as RetryExchangeOptions['retryIf']);

  pipe(
    retryExchange({
      ...mockOptions,
      retryIf: mockRetryIf,
    })({
      forward,
      client,
      dispatchDebug,
    })(ops$),
    tap(result),
    publish
  );

  next(op);
  jest.runAllTimers();

  expect(mockRetryIf).toHaveBeenCalledTimes(numberRetriesBeforeSuccess);
  expect(mockRetryIf).toHaveBeenCalledWith(queryOneError as any, op);

  // one for original source, one for retry
  expect(response).toHaveBeenCalledTimes(1 + numberRetriesBeforeSuccess);
  expect(result).toHaveBeenCalledTimes(1);
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
      dispatchDebug,
    })(ops$),
    tap(result),
    publish
  );

  next(op);

  jest.runAllTimers();

  // max number of retries, plus original call
  expect(response).toHaveBeenCalledTimes(mockOptions.maxNumberAttempts);
  expect(result).toHaveBeenCalledTimes(1);
});

it('should allow retryWhen to return falsy value and act as replacement of retryIf', () => {
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

  const retryWith = jest.fn(() => null);

  pipe(
    retryExchange({
      ...mockOptions,
      retryIf: undefined,
      retryWith,
    })({
      forward,
      client,
      dispatchDebug,
    })(ops$),
    tap(result),
    publish
  );

  next(op);

  jest.runAllTimers();

  // max number of retries, plus original call
  expect(retryWith).toHaveBeenCalledTimes(1);
  expect(response).toHaveBeenCalledTimes(1);
  expect(result).toHaveBeenCalledTimes(1);
});

it('should allow retryWhen to return new operations when retrying', () => {
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

  const retryWith = jest.fn((_error, operation) => {
    return makeOperation(operation.kind, operation, {
      ...operation.context,
      counter: (operation.context?.counter || 0) + 1,
    });
  });

  pipe(
    retryExchange({
      ...mockOptions,
      retryIf: undefined,
      retryWith,
    })({
      forward,
      client,
      dispatchDebug,
    })(ops$),
    tap(result),
    publish
  );

  next(op);

  jest.runAllTimers();

  // max number of retries, plus original call
  expect(retryWith).toHaveBeenCalledTimes(mockOptions.maxNumberAttempts - 1);
  expect(response).toHaveBeenCalledTimes(mockOptions.maxNumberAttempts);
  expect(result).toHaveBeenCalledTimes(1);

  expect(response.mock.calls[1][0]).toHaveProperty('context.counter', 1);
  expect(response.mock.calls[2][0]).toHaveProperty('context.counter', 2);
});

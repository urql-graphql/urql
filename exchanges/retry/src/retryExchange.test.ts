import {
  Source,
  pipe,
  map,
  makeSubject,
  mergeMap,
  fromValue,
  fromArray,
  publish,
  tap,
} from 'wonka';
import { vi, expect, it, beforeEach, afterEach } from 'vitest';

import {
  gql,
  createClient,
  makeOperation,
  Operation,
  OperationResult,
  ExchangeIO,
} from '@urql/core';

import { retryExchange } from './retryExchange';

const dispatchDebug = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
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
  client = createClient({
    url: 'http://0.0.0.0',
    exchanges: [],
  });
  op = client.createRequestOperation('query', {
    key: 1,
    query: queryOne,
  });

  ({ source: ops$, next } = makeSubject<Operation>());
});

it('retries if it hits an error and works for multiple concurrent operations', () => {
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

  const response = vi.fn((forwardOp: Operation): OperationResult => {
    expect(
      forwardOp.key === op.key || forwardOp.key === opTwo.key
    ).toBeTruthy();

    return {
      operation: forwardOp,
      // @ts-ignore
      error: forwardOp.key === 2 ? queryTwoError : queryOneError,
    };
  });

  const result = vi.fn();
  const forward: ExchangeIO = ops$ => {
    return pipe(ops$, map(response));
  };

  const mockRetryIf = vi.fn(() => true);

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

  vi.runAllTimers();

  expect(mockRetryIf).toHaveBeenCalledTimes(mockOptions.maxNumberAttempts);

  expect(response).toHaveBeenCalledTimes(mockOptions.maxNumberAttempts);

  // result should only ever be called once per operation
  expect(result).toHaveBeenCalledTimes(1);

  next(opTwo);

  vi.runAllTimers();

  expect(mockRetryIf).toHaveBeenCalledWith(queryTwoError as any, opTwo);

  // max number of retries for each op
  expect(response).toHaveBeenCalledTimes(mockOptions.maxNumberAttempts * 2);
  expect(result).toHaveBeenCalledTimes(2);
});

it('should retry x number of times and then return the successful result', () => {
  const numberRetriesBeforeSuccess = 3;
  const response = vi.fn((forwardOp: Operation): OperationResult => {
    expect(forwardOp.key).toBe(op.key);
    // @ts-ignore
    return {
      operation: forwardOp,
      ...(forwardOp.context.retry?.count >= numberRetriesBeforeSuccess
        ? { data: queryOneData }
        : { error: queryOneError }),
    };
  });

  const result = vi.fn();
  const forward: ExchangeIO = ops$ => {
    return pipe(ops$, map(response));
  };

  const mockRetryIf = vi.fn(() => true);

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
  vi.runAllTimers();

  expect(mockRetryIf).toHaveBeenCalledTimes(numberRetriesBeforeSuccess);
  expect(mockRetryIf).toHaveBeenCalledWith(queryOneError as any, op);

  // one for original source, one for retry
  expect(response).toHaveBeenCalledTimes(1 + numberRetriesBeforeSuccess);
  expect(result).toHaveBeenCalledTimes(1);
});

it('should reset the retry counter if an operation succeeded first', () => {
  let call = 0;
  const response = vi.fn((forwardOp: Operation): Source<any> => {
    expect(forwardOp.key).toBe(op.key);
    if (call === 0) {
      call++;
      return fromValue({
        operation: forwardOp,
        error: queryOneError,
      } as any);
    } else if (call === 1) {
      call++;
      return fromArray([
        {
          operation: forwardOp,
          error: queryOneError,
        } as any,
        {
          operation: forwardOp,
          data: queryOneData,
        } as any,
      ]);
    } else {
      expect(forwardOp.context.retry).toEqual({ count: 0, delay: null });

      return fromValue({
        operation: forwardOp,
        data: queryOneData,
      } as any);
    }
  });

  const result = vi.fn();
  const forward: ExchangeIO = ops$ => {
    return pipe(ops$, mergeMap(response));
  };

  const mockRetryIf = vi.fn(() => true);

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
  vi.runAllTimers();

  expect(mockRetryIf).toHaveBeenCalledTimes(2);
  expect(mockRetryIf).toHaveBeenCalledWith(queryOneError as any, op);

  expect(response).toHaveBeenCalledTimes(3);
  expect(result).toHaveBeenCalledTimes(2);
});

it(`should still retry if retryIf undefined but there is a networkError`, () => {
  const errorWithNetworkError = {
    ...queryOneError,
    networkError: 'scary network error',
  };
  const response = vi.fn((forwardOp: Operation): OperationResult => {
    expect(forwardOp.key).toBe(op.key);
    return {
      operation: forwardOp,
      // @ts-ignore
      error: errorWithNetworkError,
    };
  });

  const result = vi.fn();
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

  vi.runAllTimers();

  // max number of retries, plus original call
  expect(response).toHaveBeenCalledTimes(mockOptions.maxNumberAttempts);
  expect(result).toHaveBeenCalledTimes(1);
});

it('should allow retryWhen to return falsy value and act as replacement of retryIf', () => {
  const errorWithNetworkError = {
    ...queryOneError,
    networkError: 'scary network error',
  };
  const response = vi.fn((forwardOp: Operation): OperationResult => {
    expect(forwardOp.key).toBe(op.key);
    return {
      operation: forwardOp,
      // @ts-ignore
      error: errorWithNetworkError,
    };
  });

  const result = vi.fn();
  const forward: ExchangeIO = ops$ => {
    return pipe(ops$, map(response));
  };

  const retryWith = vi.fn(() => null);

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

  vi.runAllTimers();

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
  const response = vi.fn((forwardOp: Operation): OperationResult => {
    expect(forwardOp.key).toBe(op.key);
    return {
      operation: forwardOp,
      // @ts-ignore
      error: errorWithNetworkError,
    };
  });

  const result = vi.fn();
  const forward: ExchangeIO = ops$ => {
    return pipe(ops$, map(response));
  };

  const retryWith = vi.fn((_error, operation) => {
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

  vi.runAllTimers();

  // max number of retries, plus original call
  expect(retryWith).toHaveBeenCalledTimes(mockOptions.maxNumberAttempts - 1);
  expect(response).toHaveBeenCalledTimes(mockOptions.maxNumberAttempts);
  expect(result).toHaveBeenCalledTimes(1);

  expect(response.mock.calls[1][0]).toHaveProperty('context.counter', 1);
  expect(response.mock.calls[2][0]).toHaveProperty('context.counter', 2);
});

it('should increase retries by initialDelayMs for each subsequent failure', () => {
  const errorWithNetworkError = {
    ...queryOneError,
    networkError: 'scary network error',
  };
  const response = vi.fn((forwardOp: Operation): OperationResult => {
    expect(forwardOp.key).toBe(op.key);
    return {
      operation: forwardOp,
      // @ts-ignore
      error: errorWithNetworkError,
    };
  });

  const result = vi.fn();
  const forward: ExchangeIO = ops$ => {
    return pipe(ops$, map(response));
  };

  const retryWith = vi.fn((_error, operation) => {
    return makeOperation(operation.kind, operation, {
      ...operation.context,
      counter: (operation.context?.counter || 0) + 1,
    });
  });

  const fixedDelayMs = 50;

  const fixedDelayOptions = {
    ...mockOptions,
    randomDelay: false,
    initialDelayMs: fixedDelayMs,
  };

  pipe(
    retryExchange({
      ...fixedDelayOptions,
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

  // delay between each call should be increased by initialDelayMs
  // (e.g. if initialDelayMs is 5s, first retry is waits 5 seconds, second retry waits 10 seconds)
  for (let i = 1; i <= fixedDelayOptions.maxNumberAttempts; i++) {
    expect(response).toHaveBeenCalledTimes(i);
    vi.advanceTimersByTime(i * fixedDelayOptions.initialDelayMs);
  }
});

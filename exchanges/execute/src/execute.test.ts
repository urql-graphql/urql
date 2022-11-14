jest.mock('graphql', () => {
  const graphql = jest.requireActual('graphql');

  return {
    __esModule: true,
    ...graphql,
    print: jest.fn(() => '{ placeholder }'),
    execute: jest.fn(() => ({ key: 'value' })),
    subscribe: jest.fn(),
  };
});

import { fetchExchange } from 'urql';
import { executeExchange } from './execute';
import { execute, print, subscribe } from 'graphql';
import {
  pipe,
  fromValue,
  toPromise,
  take,
  makeSubject,
  empty,
  Source,
} from 'wonka';
import {
  context,
  queryOperation,
  subscriptionOperation,
} from '@urql/core/test-utils';
import {
  makeErrorResult,
  makeOperation,
  Client,
  getOperationName,
  OperationResult,
} from '@urql/core';

const mocked = (x: any): any => x;

const schema = 'STUB_SCHEMA' as any;
const exchangeArgs = {
  forward: a => a,
  client: {},
} as any;

const expectedQueryOperationName = getOperationName(queryOperation.query);
const expectedSubscribeOperationName = getOperationName(
  subscriptionOperation.query
);

const fetchMock = (global as any).fetch as jest.Mock;
const mockHttpResponseData = { key: 'value' };

beforeEach(() => {
  jest.clearAllMocks();
  mocked(print).mockImplementation(a => a as any);
  mocked(execute).mockResolvedValue({ data: mockHttpResponseData });
  mocked(subscribe).mockImplementation(async function* x(this: any) {
    yield { data: { key: 'value1' } };
    yield { data: { key: 'value2' } };
    yield { data: { key: 'value3' } };
  });
});

afterEach(() => {
  fetchMock.mockClear();
});

describe('on operation', () => {
  it('calls execute with args', async () => {
    const context = 'USER_ID=123';

    await pipe(
      fromValue(queryOperation),
      executeExchange({ schema, context })(exchangeArgs),
      take(1),
      toPromise
    );

    expect(mocked(execute)).toBeCalledTimes(1);
    expect(mocked(execute)).toBeCalledWith({
      schema,
      document: queryOperation.query,
      rootValue: undefined,
      contextValue: context,
      variableValues: queryOperation.variables,
      operationName: expectedQueryOperationName,
      fieldResolver: undefined,
      typeResolver: undefined,
      subscribeFieldResolver: undefined,
    });
  });

  it('calls subscribe with args', async () => {
    const context = 'USER_ID=123';

    await pipe(
      fromValue(subscriptionOperation),
      executeExchange({ schema, context })(exchangeArgs),
      take(3),
      toPromise
    );

    expect(mocked(subscribe)).toBeCalledTimes(1);
    expect(mocked(subscribe)).toBeCalledWith({
      schema,
      document: subscriptionOperation.query,
      rootValue: undefined,
      contextValue: context,
      variableValues: subscriptionOperation.variables,
      operationName: expectedSubscribeOperationName,
      fieldResolver: undefined,
      typeResolver: undefined,
      subscribeFieldResolver: undefined,
    });
  });

  it('calls execute after executing context as a function', async () => {
    const context = operation => {
      expect(operation).toBe(queryOperation);
      return 'CALCULATED_USER_ID=' + 8 * 10;
    };

    await pipe(
      fromValue(queryOperation),
      executeExchange({ schema, context })(exchangeArgs),
      take(1),
      toPromise
    );

    expect(mocked(execute)).toBeCalledTimes(1);
    expect(mocked(execute)).toBeCalledWith({
      schema,
      document: queryOperation.query,
      rootValue: undefined,
      contextValue: 'CALCULATED_USER_ID=80',
      variableValues: queryOperation.variables,
      operationName: expectedQueryOperationName,
      fieldResolver: undefined,
      typeResolver: undefined,
      subscribeFieldResolver: undefined,
    });
  });

  it('calls execute after executing context as a function returning a Promise', async () => {
    const context = async operation => {
      expect(operation).toBe(queryOperation);
      return 'CALCULATED_USER_ID=' + 8 * 10;
    };

    await pipe(
      fromValue(queryOperation),
      executeExchange({ schema, context })(exchangeArgs),
      take(1),
      toPromise
    );

    expect(mocked(execute)).toBeCalledTimes(1);
    expect(mocked(execute)).toBeCalledWith({
      schema,
      document: queryOperation.query,
      rootValue: undefined,
      contextValue: 'CALCULATED_USER_ID=80',
      variableValues: queryOperation.variables,
      operationName: expectedQueryOperationName,
      fieldResolver: undefined,
      typeResolver: undefined,
      subscribeFieldResolver: undefined,
    });
  });

  it('should return data from subscribe', async () => {
    const context = 'USER_ID=123';

    const responseFromExecuteExchange = await pipe(
      fromValue(subscriptionOperation),
      executeExchange({ schema, context })(exchangeArgs),
      take(3),
      toPromise
    );

    expect(responseFromExecuteExchange.data).toEqual({ key: 'value3' });
  });

  it('should return the same data as the fetch exchange', async () => {
    const context = 'USER_ID=123';

    const responseFromExecuteExchange = await pipe(
      fromValue(queryOperation),
      executeExchange({ schema, context })(exchangeArgs),
      take(1),
      toPromise
    );

    fetchMock.mockResolvedValue({
      status: 200,
      text: jest
        .fn()
        .mockResolvedValue(JSON.stringify({ data: mockHttpResponseData })),
    });

    const responseFromFetchExchange = await pipe(
      fromValue(queryOperation),
      fetchExchange({
        dispatchDebug: jest.fn(),
        forward: () => empty as Source<OperationResult>,
        client: {} as Client,
      }),
      toPromise
    );

    expect(responseFromExecuteExchange.data).toEqual(
      responseFromFetchExchange.data
    );
    expect(mocked(execute)).toBeCalledTimes(1);
    expect(fetchMock).toBeCalledTimes(1);
  });

  it('should trim undefined values before calling execute()', async () => {
    const contextValue = 'USER_ID=123';

    const operation = makeOperation(
      'query',
      {
        ...queryOperation,
        variables: { ...queryOperation.variables, withLastName: undefined },
      },
      context
    );

    await pipe(
      fromValue(operation),
      executeExchange({ schema, context: contextValue })(exchangeArgs),
      take(1),
      toPromise
    );

    expect(mocked(execute)).toBeCalledTimes(1);
    expect(mocked(execute)).toBeCalledWith({
      schema,
      document: queryOperation.query,
      rootValue: undefined,
      contextValue: contextValue,
      variableValues: queryOperation.variables,
      operationName: expectedQueryOperationName,
      fieldResolver: undefined,
      typeResolver: undefined,
      subscribeFieldResolver: undefined,
    });

    const variables = mocked(execute).mock.calls[0][0].variableValues;

    for (const key in variables) {
      expect(variables[key]).not.toBeUndefined();
    }
  });
});

describe('on success response', () => {
  it('returns operation result', async () => {
    const response = await pipe(
      fromValue(queryOperation),
      executeExchange({ schema })(exchangeArgs),
      take(1),
      toPromise
    );

    expect(response).toEqual({
      operation: queryOperation,
      data: mockHttpResponseData,
      hasNext: false,
    });
  });
});

describe('on error response', () => {
  const errors = ['error'] as any;

  beforeEach(() => {
    mocked(execute).mockResolvedValue({ errors });
  });

  it('returns operation result', async () => {
    const response = await pipe(
      fromValue(queryOperation),
      executeExchange({ schema })(exchangeArgs),
      take(1),
      toPromise
    );

    expect(response).toHaveProperty('operation', queryOperation);
    expect(response).toHaveProperty('error');
  });
});

describe('on thrown error', () => {
  const errors = ['error'] as any;

  beforeEach(() => {
    mocked(execute).mockRejectedValue({ errors });
  });

  it('returns operation result', async () => {
    const response = await pipe(
      fromValue(queryOperation),
      executeExchange({ schema })(exchangeArgs),
      take(1),
      toPromise
    );

    const expected = makeErrorResult(queryOperation, errors);

    expect(response.operation).toBe(expected.operation);
    expect(response.data).toEqual(expected.data);
    expect(response.error).toEqual(expected.error);
  });
});

describe('on unsupported operation', () => {
  const operation = makeOperation(
    'teardown',
    queryOperation,
    queryOperation.context
  );

  it('returns operation result', async () => {
    const { source, next } = makeSubject<any>();

    const response = pipe(
      source,
      executeExchange({ schema })(exchangeArgs),
      take(1),
      toPromise
    );

    next(operation);
    expect(await response).toEqual(operation);
  });
});

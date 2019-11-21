jest.mock('graphql');

import { executeExchange } from './execute';
import { execute, print } from 'graphql';
import {
  pipe,
  fromValue,
  toArray,
  toPromise,
  tap,
  take,
  fromArray,
  makeSubject,
} from 'wonka';
import { mocked } from 'ts-jest/utils';
import { queryOperation } from '../test-utils';
import { makeErrorResult, makeResult } from '../utils';

const schema = 'STUB_SCHEMA' as any;
const exchangeArgs = {
  forward: a => a,
  client: {},
} as any;

beforeEach(jest.clearAllMocks);

beforeEach(() => {
  mocked(print).mockImplementation(a => a as any);
  mocked(execute).mockReturnValue(Promise.resolve({ data: {} }));
});

describe('on operation', () => {
  it('calls execute with args', async () => {
    await pipe(
      fromValue(queryOperation),
      executeExchange({ schema })(exchangeArgs),
      take(1),
      toPromise
    );

    expect(mocked(execute)).toBeCalledTimes(1);
    expect(mocked(execute)).toBeCalledWith(
      schema,
      queryOperation.query,
      undefined,
      undefined,
      queryOperation.variables,
      queryOperation.operationName,
      undefined,
      undefined
    );
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
      data: {},
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

    expect(response).toMatchObject(makeErrorResult(queryOperation, errors));
  });
});

describe('on unsupporte doperation', () => {
  const operation = {
    ...queryOperation,
    operationName: 'teardown',
  } as const;

  it('returns operation result', async () => {
    const [stream, next] = makeSubject<any>();

    const response = pipe(
      stream,
      executeExchange({ schema })(exchangeArgs),
      take(1),
      toPromise
    );

    next(operation);
    expect(await response).toEqual(operation);
  });
});

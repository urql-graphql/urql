import gql from 'graphql-tag';

import { pipe, map, makeSubject, publish, tap } from 'wonka';

import {
  createClient,
  Operation,
  OperationResult,
  ExchangeIO,
} from '@urql/core';
import { mapContextExchange } from './mapContextExchange';

const dispatchDebug = jest.fn();

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

const query = gql`
  {
    author {
      id
      name
    }
  }
`;

let client, op, ops$, next;
beforeEach(() => {
  client = createClient({ url: 'http://0.0.0.0' });

  ({ source: ops$, next } = makeSubject<Operation>());
});

it('should map context with fetchOptions function', () => {
  const fetchOptions = jest.fn(() => ({ test: 'urql' }));
  const ctx = { fetchOptions };
  op = client.createRequestOperation(
    'query',
    {
      key: 1,
      query,
    },
    ctx
  );

  const response = jest.fn(
    (forwardOp: Operation): OperationResult => {
      // @ts-ignore
      return forwardOp;
    }
  );

  const result = jest.fn();
  const forward: ExchangeIO = ops$ => {
    return pipe(ops$, map(response));
  };

  const mapper = jest.fn(ctx => ctx);
  pipe(
    mapContextExchange(mapper)({
      forward,
      client,
      dispatchDebug,
    })(ops$),
    tap(result),
    publish
  );

  next(op);
  expect(mapper).toBeCalledTimes(1);
  expect(mapper).toBeCalledWith({
    fetch: undefined,
    fetchOptions: { test: 'urql' },
    preferGetMethod: false,
    requestPolicy: 'cache-first',
    url: 'http://0.0.0.0',
  });
  expect(result).toBeCalledTimes(1);
  expect(fetchOptions).toBeCalledTimes(1);
});

it('should map async context', () => {
  const ctx = {};

  op = client.createRequestOperation(
    'query',
    {
      key: 1,
      query,
    },
    ctx
  );

  const response = jest.fn(
    (forwardOp: Operation): OperationResult => {
      // @ts-ignore
      return forwardOp;
    }
  );

  const result = jest.fn();
  const forward: ExchangeIO = ops$ => {
    return pipe(ops$, map(response));
  };

  const mapper = jest.fn(async ctx => ({ ...ctx, test: 'hi' }));
  pipe(
    mapContextExchange(mapper)({
      forward,
      client,
      dispatchDebug,
    })(ops$),
    tap(result),
    publish
  );

  next(op);
  jest.runAllTimers();

  expect(mapper).toBeCalledTimes(1);
  expect(mapper).toBeCalledWith({
    fetch: undefined,
    fetchOptions: undefined,
    preferGetMethod: false,
    requestPolicy: 'cache-first',
    url: 'http://0.0.0.0',
  });
  expect(result).toBeCalledTimes(1);
});

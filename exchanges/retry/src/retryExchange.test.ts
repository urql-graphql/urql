import gql from 'graphql-tag';

import {
  pipe,
  map,
  fromValue,
  toArray,
  makeSubject,
  // forEach,
  // delay,
  publish,
  tap,
} from 'wonka';

import {
  createClient,
  Operation,
  OperationResult,
  ExchangeIO,
} from '@urql/core';
import { retryExchange } from './retryExchange';

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

it('forwards skipped operations', () => {
  const client = createClient({ url: 'https://example.com' });
  const operation = client.createRequestOperation('query', {
    key: 123,
    query: {} as any,
  });
  const forward = ops$ =>
    pipe(
      ops$,
      map(operation => ({ operation } as OperationResult))
    );

  const res = pipe(
    retryExchange(mockOptions)({ forward, client })(fromValue(operation)),
    toArray
  );

  expect(forward).toHaveBeenCalledWith(operation);
  expect(res).toEqual([{ operation }]);
});

it('writes queries to the cache', () => {
  const client = createClient({ url: 'http://0.0.0.0' });
  const op = client.createRequestOperation('query', {
    key: 1,
    query: queryOne,
  });

  const response = jest.fn(
    (forwardOp: Operation): OperationResult => {
      expect(forwardOp.key).toBe(op.key);
      return { operation: forwardOp, data: queryOneData };
    }
  );

  const { source: ops$, next } = makeSubject<Operation>();
  const result = jest.fn();
  const forward: ExchangeIO = ops$ => pipe(ops$, map(response));

  pipe(
    retryExchange(mockOptions)({ forward, client })(ops$),
    tap(result),
    publish
  );

  next(op);
  next(op);
  expect(response).toHaveBeenCalledTimes(1);
  expect(result).toHaveBeenCalledTimes(2);

  expect(result.mock.calls[0][0]).toHaveProperty(
    'operation.context.meta.cacheOutcome',
    'miss'
  );
  expect(result.mock.calls[1][0]).toHaveProperty(
    'operation.context.meta.cacheOutcome',
    'hit'
  );
});

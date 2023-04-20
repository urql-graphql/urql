// @vitest-environment jsdom

import { pipe, map, makeSubject, publish, tap } from 'wonka';
import { vi, expect, it, beforeEach } from 'vitest';

import {
  gql,
  createClient,
  Operation,
  OperationResult,
  ExchangeIO,
} from '@urql/core';

import { queryResponse } from '../../../packages/core/src/test-utils';
import { refocusExchange } from './refocusExchange';

const dispatchDebug = vi.fn();

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

it(`attaches a listener and redispatches queries on call`, () => {
  const response = vi.fn((forwardOp: Operation): OperationResult => {
    return {
      ...queryResponse,
      operation: forwardOp,
      data: queryOneData,
    };
  });

  let listener;
  const spy = vi
    .spyOn(window, 'addEventListener')
    .mockImplementation((_keyword, fn) => {
      listener = fn;
    });
  const reexecuteSpy = vi
    .spyOn(client, 'reexecuteOperation')
    .mockImplementation(() => ({}));

  const result = vi.fn();
  const forward: ExchangeIO = ops$ => {
    return pipe(ops$, map(response));
  };

  pipe(
    refocusExchange()({
      forward,
      client,
      dispatchDebug,
    })(ops$),
    tap(result),
    publish
  );

  expect(spy).toBeCalledTimes(1);
  expect(spy).toBeCalledWith('visibilitychange', expect.anything());

  next(op);

  listener();
  expect(reexecuteSpy).toBeCalledTimes(1);
  expect(reexecuteSpy).toBeCalledWith({
    context: expect.anything(),
    key: 1,
    query: queryOne,
    kind: 'query',
  });
});

import gql from 'graphql-tag';

import { pipe, map, makeSubject, publish, tap } from 'wonka';

import {
  createClient,
  Operation,
  OperationResult,
  ExchangeIO,
} from '@urql/core';
import { refocusExchange } from './refocusExchange';

const dispatchDebug = jest.fn();

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
  client = createClient({ url: 'http://0.0.0.0' });
  op = client.createRequestOperation('query', {
    key: 1,
    query: queryOne,
  });

  ({ source: ops$, next } = makeSubject<Operation>());
});

it(`attaches a listener and redispatches queries on call`, () => {
  const response = jest.fn(
    (forwardOp: Operation): OperationResult => {
      return {
        operation: forwardOp,
        data: queryOneData,
      };
    }
  );

  let listener;
  const spy = jest
    .spyOn(window, 'addEventListener')
    .mockImplementation((_keyword, fn) => {
      listener = fn;
    });
  const reexecuteSpy = jest
    .spyOn(client, 'reexecuteOperation')
    .mockImplementation(() => ({}));

  const result = jest.fn();
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

    // TODO: Remove this when the deprecated "operationName" property is removed
    operationName: 'query',
  });
});

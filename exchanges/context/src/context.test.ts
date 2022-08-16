import { pipe, map, makeSubject, publish, tap } from 'wonka';

import {
  gql,
  createClient,
  Operation,
  OperationResult,
  ExchangeIO,
} from '@urql/core';

import { contextExchange } from './context';

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

const dispatchDebug = jest.fn();
let client, op, ops$, next;
beforeEach(() => {
  client = createClient({ url: 'http://0.0.0.0' });
  op = client.createRequestOperation('query', {
    key: 1,
    query: queryOne,
  });

  ({ source: ops$, next } = makeSubject<Operation>());
});

it(`calls getContext`, () => {
  const response = jest.fn(
    (forwardOp: Operation): OperationResult => {
      return {
        operation: forwardOp,
        data: queryOneData,
      };
    }
  );

  const result = jest.fn();
  const forward: ExchangeIO = ops$ => {
    return pipe(ops$, map(response));
  };

  const headers = { hello: 'world' };
  pipe(
    contextExchange({
      getContext: op => ({ ...op.context, headers }),
    })({
      forward,
      client,
      dispatchDebug,
    })(ops$),
    tap(result),
    publish
  );

  next(op);

  expect(response).toHaveBeenCalledTimes(1);
  expect(response.mock.calls[0][0].context.headers).toEqual(headers);
  expect(result).toHaveBeenCalledTimes(1);
});

it(`calls getContext async`, done => {
  const response = jest.fn(
    (forwardOp: Operation): OperationResult => {
      return {
        operation: forwardOp,
        data: queryOneData,
      };
    }
  );

  const result = jest.fn();
  const forward: ExchangeIO = ops$ => {
    return pipe(ops$, map(response));
  };

  const headers = { hello: 'world' };
  pipe(
    contextExchange({
      getContext: async op => {
        await Promise.resolve();
        return { ...op.context, headers };
      },
    })({
      forward,
      client,
      dispatchDebug,
    })(ops$),
    tap(result),
    publish
  );

  next(op);

  setTimeout(() => {
    expect(response).toHaveBeenCalledTimes(1);
    expect(response.mock.calls[0][0].context.headers).toEqual(headers);
    expect(result).toHaveBeenCalledTimes(1);
    done();
  }, 10);
});

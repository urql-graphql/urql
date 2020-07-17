import gql from 'graphql-tag';

import { pipe, map, makeSubject, publish, tap } from 'wonka';

import {
  createClient,
  Operation,
  OperationResult,
  ExchangeIO,
} from '@urql/core';
import { requestPolicyExchange } from './requestPolicyExchange';

const dispatchDebug = jest.fn();

const mockOptions = {
  ttl: 5,
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

let client, op, ops$, next;
beforeEach(() => {
  client = createClient({ url: 'http://0.0.0.0' });
  op = client.createRequestOperation('query', {
    key: 1,
    query: queryOne,
  });

  ({ source: ops$, next } = makeSubject<Operation>());
});

it(`upgrades to cache-and-network`, done => {
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

  pipe(
    requestPolicyExchange(mockOptions)({
      forward,
      client,
      dispatchDebug,
    })(ops$),
    tap(result),
    publish
  );

  next(op);

  expect(response).toHaveBeenCalledTimes(1);
  expect(response.mock.calls[0][0].context.requestPolicy).toEqual(
    'cache-first'
  );
  expect(result).toHaveBeenCalledTimes(1);

  setTimeout(() => {
    next(op);
    expect(response).toHaveBeenCalledTimes(2);
    expect(response.mock.calls[1][0].context.requestPolicy).toEqual(
      'cache-and-network'
    );
    expect(result).toHaveBeenCalledTimes(2);
    done();
  }, 10);
});

it(`doesn't upgrade when shouldUpgrade returns false`, done => {
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

  const shouldUpgrade = jest.fn(() => false);
  pipe(
    requestPolicyExchange({ ...mockOptions, shouldUpgrade })({
      forward,
      client,
      dispatchDebug,
    })(ops$),
    tap(result),
    publish
  );

  next(op);

  expect(response).toHaveBeenCalledTimes(1);
  expect(response.mock.calls[0][0].context.requestPolicy).toEqual(
    'cache-first'
  );
  expect(result).toHaveBeenCalledTimes(1);

  setTimeout(() => {
    next(op);
    expect(response).toHaveBeenCalledTimes(2);
    expect(response.mock.calls[1][0].context.requestPolicy).toEqual(
      'cache-first'
    );
    expect(result).toHaveBeenCalledTimes(2);
    expect(shouldUpgrade).toBeCalledTimes(1);
    done();
  }, 10);
});

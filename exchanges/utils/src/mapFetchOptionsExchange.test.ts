import gql from 'graphql-tag';

import { pipe, map, makeSubject, publish, tap } from 'wonka';

import {
  createClient,
  Operation,
  OperationResult,
  ExchangeIO,
} from '@urql/core';
import { mapFetchOptionsExchange } from './mapFetchOptionsExchange';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

let client, op, ops$, next;
beforeEach(() => {
  client = createClient({ url: 'http://0.0.0.0' });

  ({ source: ops$, next } = makeSubject<Operation>(undefined));
});

it('Resolves asynchronous fetchOptions', () => {
  const response = jest.fn(
    (forwardOp: Operation): OperationResult => {
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

  pipe(
    mapFetchOptionsExchange(options => {
      return options || {};
    })({
      forward,
      client,
      dispatchDebug: jest.fn(),
    })(ops$),
    tap(result),
    publish
  );

  next(op);
});

import {
  Source,
  pipe,
  fromValue,
  fromArray,
  toPromise,
  delay,
  take,
  tap,
  map,
} from 'wonka';

import { Client, Operation, OperationResult, CombinedError } from '@urql/core';

import { vi, expect, it } from 'vitest';
import { queryOperation } from '../../../packages/core/src/test-utils';
import { persistedExchange } from './persistedExchange';

const makeExchangeArgs = () => {
  const operations: Operation[] = [];

  const result = vi.fn(
    (operation: Operation): OperationResult => ({ operation })
  );

  return {
    operations,
    result,
    exchangeArgs: {
      forward: (op$: Source<Operation>) =>
        pipe(
          op$,
          tap(op => operations.push(op)),
          map(result)
        ),
      client: new Client({ url: '/api' }),
    } as any,
  };
};

it('adds the APQ extensions correctly', async () => {
  const { exchangeArgs } = makeExchangeArgs();

  const res = await pipe(
    fromValue(queryOperation),
    persistedExchange()(exchangeArgs),
    take(1),
    toPromise
  );

  expect(res.operation.context.persistAttempt).toBe(true);
  expect(res.operation.extensions).toEqual({
    persistedQuery: {
      version: 1,
      sha256Hash: expect.any(String),
      miss: undefined,
    },
  });
});

it('retries query when persisted query resulted in miss', async () => {
  const { result, operations, exchangeArgs } = makeExchangeArgs();

  result.mockImplementationOnce(operation => ({
    operation,
    error: new CombinedError({
      graphQLErrors: [{ message: 'PersistedQueryNotFound' }],
    }),
  }));

  const res = await pipe(
    fromValue(queryOperation),
    persistedExchange()(exchangeArgs),
    take(1),
    toPromise
  );

  expect(res.operation.context.persistAttempt).toBe(true);
  expect(operations.length).toBe(2);

  expect(operations[1].extensions).toEqual({
    persistedQuery: {
      version: 1,
      sha256Hash: expect.any(String),
      miss: true,
    },
  });
});

it('retries query persisted query resulted in unsupported', async () => {
  const { result, operations, exchangeArgs } = makeExchangeArgs();

  result.mockImplementationOnce(operation => ({
    operation,
    error: new CombinedError({
      graphQLErrors: [{ message: 'PersistedQueryNotSupported' }],
    }),
  }));

  await pipe(
    fromArray([queryOperation, queryOperation]),
    delay(0),
    persistedExchange()(exchangeArgs),
    take(2),
    toPromise
  );

  expect(operations.length).toBe(3);

  expect(operations[1].extensions).toEqual({
    persistedQuery: undefined,
  });

  expect(operations[2].extensions).toEqual(undefined);
});

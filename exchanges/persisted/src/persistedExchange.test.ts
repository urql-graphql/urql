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
import {
  queryResponse,
  queryOperation,
} from '../../../packages/core/src/test-utils';
import { persistedExchange } from './persistedExchange';

const makeExchangeArgs = () => {
  const operations: Operation[] = [];

  const result = vi.fn(
    (operation: Operation): OperationResult => ({ ...queryResponse, operation })
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
      client: new Client({ url: '/api', exchanges: [] }),
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
    ...queryResponse,
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
    ...queryResponse,
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

it('fails gracefully when an invalid result with `PersistedQueryNotFound` is always delivered', async () => {
  const { result, operations, exchangeArgs } = makeExchangeArgs();

  result.mockImplementation(operation => ({
    ...queryResponse,
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

  expect(console.warn).toHaveBeenLastCalledWith(
    expect.stringMatching(/two misses/i)
  );
});

it('skips operation when generateHash returns a nullish value', async () => {
  const { result, operations, exchangeArgs } = makeExchangeArgs();

  result.mockImplementationOnce(operation => ({
    ...queryResponse,
    operation,
    data: null,
  }));

  const res = await pipe(
    fromValue(queryOperation),
    persistedExchange({ generateHash: async () => null })(exchangeArgs),
    take(1),
    toPromise
  );

  expect(res.operation.context.persistAttempt).toBe(true);
  expect(operations.length).toBe(1);
  expect(operations[0]).not.toHaveProperty('extensions.persistedQuery');
});

it.each([true, false, 'force', 'within-url-limit'] as const)(
  'sets `context.preferGetMethod` to %s when `options.preferGetForPersistedQueries` is %s',
  async preferGetMethodValue => {
    const { exchangeArgs } = makeExchangeArgs();

    const res = await pipe(
      fromValue(queryOperation),
      persistedExchange({ preferGetForPersistedQueries: preferGetMethodValue })(
        exchangeArgs
      ),
      take(1),
      toPromise
    );

    expect(res.operation.context.preferGetMethod).toBe(preferGetMethodValue);
  }
);

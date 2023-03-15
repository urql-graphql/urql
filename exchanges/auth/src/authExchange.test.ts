import {
  Source,
  pipe,
  fromValue,
  toPromise,
  take,
  makeSubject,
  publish,
  scan,
  tap,
  map,
} from 'wonka';

import {
  makeOperation,
  CombinedError,
  Client,
  Operation,
  OperationResult,
} from '@urql/core';

import { vi, expect, it } from 'vitest';
import { print } from 'graphql';
import { queryOperation } from '../../../packages/core/src/test-utils';
import { authExchange } from './authExchange';

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
      client: new Client({
        url: '/api',
        exchanges: [],
      }),
    } as any,
  };
};

it('adds the auth header correctly', async () => {
  const { exchangeArgs } = makeExchangeArgs();

  const res = await pipe(
    fromValue(queryOperation),
    authExchange(async utils => {
      const token = 'my-token';
      return {
        addAuthToOperation(operation) {
          return utils.appendHeaders(operation, {
            Authorization: token,
          });
        },
        didAuthError: () => false,
        async refreshAuth() {
          /*noop*/
        },
      };
    })(exchangeArgs),
    take(1),
    toPromise
  );

  expect(res.operation.context.authAttempt).toBe(false);
  expect(res.operation.context.fetchOptions).toEqual({
    ...(queryOperation.context.fetchOptions || {}),
    headers: {
      Authorization: 'my-token',
    },
  });
});

it('adds the auth header correctly when intialized asynchronously', async () => {
  const { exchangeArgs } = makeExchangeArgs();

  const res = await pipe(
    fromValue(queryOperation),
    authExchange(async utils => {
      // delayed initial auth
      await Promise.resolve();
      const token = 'async-token';

      return {
        addAuthToOperation(operation) {
          return utils.appendHeaders(operation, {
            Authorization: token,
          });
        },
        didAuthError: () => false,
        async refreshAuth() {
          /*noop*/
        },
      };
    })(exchangeArgs),
    take(1),
    toPromise
  );

  expect(res.operation.context.authAttempt).toBe(false);
  expect(res.operation.context.fetchOptions).toEqual({
    ...(queryOperation.context.fetchOptions || {}),
    headers: {
      Authorization: 'async-token',
    },
  });
});

it('supports calls to the mutate() method in refreshAuth()', async () => {
  const { exchangeArgs } = makeExchangeArgs();

  const willAuthError = vi
    .fn()
    .mockReturnValueOnce(true)
    .mockReturnValue(false);

  const [mutateRes, res] = await pipe(
    fromValue(queryOperation),
    authExchange(async utils => {
      const token = 'async-token';

      return {
        addAuthToOperation(operation) {
          return utils.appendHeaders(operation, {
            Authorization: token,
          });
        },
        willAuthError,
        didAuthError: () => false,
        async refreshAuth() {
          const result = await utils.mutate('mutation { auth }', undefined);
          expect(print(result.operation.query)).toBe('mutation {\n  auth\n}');
        },
      };
    })(exchangeArgs),
    take(2),
    scan((acc, res) => [...acc, res], [] as OperationResult[]),
    toPromise
  );

  expect(mutateRes.operation.context.fetchOptions).toEqual({
    headers: {
      Authorization: 'async-token',
    },
  });

  expect(res.operation.context.authAttempt).toBe(false);
  expect(res.operation.context.fetchOptions).toEqual({
    method: 'POST',
    headers: {
      Authorization: 'async-token',
    },
  });
});

it('adds the same token to subsequent operations', async () => {
  const { exchangeArgs } = makeExchangeArgs();
  const { source, next } = makeSubject<any>();

  const result = vi.fn();
  const auth$ = pipe(
    source,
    authExchange(async utils => {
      const token = 'my-token';
      return {
        addAuthToOperation(operation) {
          return utils.appendHeaders(operation, {
            Authorization: token,
          });
        },
        didAuthError: () => false,
        async refreshAuth() {
          /*noop*/
        },
      };
    })(exchangeArgs),
    tap(result),
    take(2),
    toPromise
  );

  await new Promise(resolve => setTimeout(resolve));

  next(queryOperation);

  next(
    makeOperation('query', queryOperation, {
      ...queryOperation.context,
      foo: 'bar',
    })
  );

  await auth$;
  expect(result).toHaveBeenCalledTimes(2);

  expect(result.mock.calls[0][0].operation.context.authAttempt).toBe(false);
  expect(result.mock.calls[0][0].operation.context.fetchOptions).toEqual({
    ...(queryOperation.context.fetchOptions || {}),
    headers: {
      Authorization: 'my-token',
    },
  });

  expect(result.mock.calls[1][0].operation.context.authAttempt).toBe(false);
  expect(result.mock.calls[1][0].operation.context.fetchOptions).toEqual({
    ...(queryOperation.context.fetchOptions || {}),
    headers: {
      Authorization: 'my-token',
    },
  });
});

it('triggers authentication when an operation did error', async () => {
  const { exchangeArgs, result, operations } = makeExchangeArgs();
  const { source, next } = makeSubject<any>();

  const didAuthError = vi.fn().mockReturnValueOnce(true);

  pipe(
    source,
    authExchange(async utils => {
      let token = 'initial-token';
      return {
        addAuthToOperation(operation) {
          return utils.appendHeaders(operation, {
            Authorization: token,
          });
        },
        didAuthError,
        async refreshAuth() {
          token = 'final-token';
        },
      };
    })(exchangeArgs),
    publish
  );

  await new Promise(resolve => setTimeout(resolve));

  result.mockReturnValueOnce({
    operation: queryOperation,
    error: new CombinedError({
      graphQLErrors: [{ message: 'Oops' }],
    }),
  });

  next(queryOperation);
  expect(result).toHaveBeenCalledTimes(1);
  expect(didAuthError).toHaveBeenCalledTimes(1);

  await new Promise(resolve => setTimeout(resolve));

  expect(result).toHaveBeenCalledTimes(2);
  expect(operations.length).toBe(2);
  expect(operations[0]).toHaveProperty(
    'context.fetchOptions.headers.Authorization',
    'initial-token'
  );
  expect(operations[1]).toHaveProperty(
    'context.fetchOptions.headers.Authorization',
    'final-token'
  );
});

it('triggers authentication when an operation will error', async () => {
  const { exchangeArgs, result, operations } = makeExchangeArgs();
  const { source, next } = makeSubject<any>();

  const willAuthError = vi
    .fn()
    .mockReturnValueOnce(true)
    .mockReturnValue(false);

  pipe(
    source,
    authExchange(async utils => {
      let token = 'initial-token';
      return {
        addAuthToOperation(operation) {
          return utils.appendHeaders(operation, {
            Authorization: token,
          });
        },
        willAuthError,
        didAuthError: () => false,
        async refreshAuth() {
          token = 'final-token';
        },
      };
    })(exchangeArgs),
    publish
  );

  await new Promise(resolve => setTimeout(resolve));

  next(queryOperation);
  expect(result).toHaveBeenCalledTimes(0);
  expect(willAuthError).toHaveBeenCalledTimes(1);

  await new Promise(resolve => setTimeout(resolve));

  expect(result).toHaveBeenCalledTimes(1);
  expect(operations.length).toBe(1);
  expect(operations[0]).toHaveProperty(
    'context.fetchOptions.headers.Authorization',
    'final-token'
  );
});

it('calls willAuthError on queued operations', async () => {
  const { exchangeArgs, result, operations } = makeExchangeArgs();
  const { source, next } = makeSubject<any>();

  let initialAuthResolve: ((_?: any) => void) | undefined;

  const willAuthError = vi
    .fn()
    .mockReturnValueOnce(true)
    .mockReturnValue(false);

  pipe(
    source,
    authExchange(async utils => {
      await new Promise(resolve => {
        initialAuthResolve = resolve;
      });

      let token = 'token';
      return {
        willAuthError,
        didAuthError: () => false,
        addAuthToOperation(operation) {
          return utils.appendHeaders(operation, {
            Authorization: token,
          });
        },
        async refreshAuth() {
          token = 'final-token';
        },
      };
    })(exchangeArgs),
    publish
  );

  await Promise.resolve();

  next({ ...queryOperation, key: 1 });
  next({ ...queryOperation, key: 2 });

  expect(result).toHaveBeenCalledTimes(0);
  expect(willAuthError).toHaveBeenCalledTimes(0);

  expect(initialAuthResolve).toBeDefined();
  initialAuthResolve!();

  await new Promise(resolve => setTimeout(resolve));

  expect(willAuthError).toHaveBeenCalledTimes(2);
  expect(result).toHaveBeenCalledTimes(2);

  expect(operations.length).toBe(2);
  expect(operations[0]).toHaveProperty(
    'context.fetchOptions.headers.Authorization',
    'final-token'
  );

  expect(operations[1]).toHaveProperty(
    'context.fetchOptions.headers.Authorization',
    'final-token'
  );
});

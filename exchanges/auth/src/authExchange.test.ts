import {
  Source,
  pipe,
  fromValue,
  toPromise,
  take,
  makeSubject,
  publish,
  tap,
  map,
} from 'wonka';

import { print } from 'graphql';
import { authExchange } from './authExchange';
import {
  makeOperation,
  CombinedError,
  Client,
  Operation,
  OperationResult,
} from '@urql/core';
import { queryOperation } from '../../../packages/core/src/test-utils';

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

const withAuthHeader = (operation, token) => {
  const fetchOptions =
    typeof operation.context.fetchOptions === 'function'
      ? operation.context.fetchOptions()
      : operation.context.fetchOptions || {};

  return makeOperation(operation.kind, operation, {
    ...operation.context,
    fetchOptions: {
      ...fetchOptions,
      headers: {
        ...fetchOptions.headers,
        Authorization: token,
      },
    },
  });
};

it('adds the auth header correctly', async () => {
  const { exchangeArgs } = makeExchangeArgs();

  const res = await pipe(
    fromValue(queryOperation),
    authExchange({
      getAuth: async () => ({ token: 'my-token' }),
      willAuthError: () => false,
      addAuthToOperation: ({ authState, operation }) => {
        return withAuthHeader(operation, authState!.token);
      },
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

it('adds the auth header correctly when it is fetched asynchronously', async () => {
  const { exchangeArgs } = makeExchangeArgs();

  const res = await pipe(
    fromValue(queryOperation),
    authExchange<{ token: string }>({
      getAuth: async () => {
        await Promise.resolve();
        return { token: 'async-token' };
      },
      willAuthError: () => false,
      addAuthToOperation: ({ authState, operation }) => {
        return withAuthHeader(operation, authState!.token);
      },
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

it('supports calls to the mutate() method in getAuth()', async () => {
  const { exchangeArgs } = makeExchangeArgs();

  const res = await pipe(
    fromValue(queryOperation),
    authExchange<{ token: string }>({
      getAuth: async ({ mutate }) => {
        const result = await mutate('mutation { auth }');
        expect(print(result.operation.query)).toBe('mutation {\n  auth\n}');
        return { token: 'async-token' };
      },
      willAuthError: () => false,
      addAuthToOperation: ({ authState, operation }) => {
        return withAuthHeader(operation, authState?.token);
      },
    })(exchangeArgs),
    take(2),
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

it('adds the same token to subsequent operations', async () => {
  const { exchangeArgs } = makeExchangeArgs();
  const { source, next } = makeSubject<any>();

  const result = vi.fn();
  const auth$ = pipe(
    source,
    authExchange({
      getAuth: async () => {
        await Promise.resolve();
        return { token: 'my-token' };
      },
      willAuthError: () => false,
      addAuthToOperation: ({ authState, operation }) => {
        return withAuthHeader(operation, authState!.token);
      },
    })(exchangeArgs),
    tap(result),
    take(2),
    toPromise
  );

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

  let initialAuth;
  let afterErrorAuth;

  const didAuthError = vi.fn().mockReturnValueOnce(true);

  const getAuth = vi
    .fn()
    .mockImplementationOnce(() => {
      initialAuth = Promise.resolve({ token: 'initial-token' });
      return initialAuth;
    })
    .mockImplementationOnce(() => {
      afterErrorAuth = Promise.resolve({ token: 'final-token' });
      return afterErrorAuth;
    });

  pipe(
    source,
    authExchange<{ token: string }>({
      getAuth,
      didAuthError,
      willAuthError: () => false,
      addAuthToOperation: ({ authState, operation }) => {
        return withAuthHeader(operation, authState?.token);
      },
    })(exchangeArgs),
    publish
  );

  await Promise.resolve();
  expect(getAuth).toHaveBeenCalledTimes(1);
  await initialAuth;
  await new Promise(res => {
    setTimeout(() => {
      res();
    });
  });

  result.mockReturnValueOnce({
    operation: queryOperation,
    error: new CombinedError({
      graphQLErrors: [{ message: 'Oops' }],
    }),
  });

  next(queryOperation);
  expect(result).toHaveBeenCalledTimes(1);
  expect(didAuthError).toHaveBeenCalledTimes(1);
  expect(getAuth).toHaveBeenCalledTimes(2);

  await afterErrorAuth;
  await new Promise(res => {
    setTimeout(() => {
      res();
    });
  });

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

  let initialAuth;
  let afterErrorAuth;

  vi.useRealTimers();
  const willAuthError = vi
    .fn()
    .mockReturnValueOnce(true)
    .mockReturnValue(false);

  const getAuth = vi
    .fn()
    .mockImplementationOnce(async () => {
      initialAuth = Promise.resolve({ token: 'initial-token' });
      return await initialAuth;
    })
    .mockImplementationOnce(() => {
      afterErrorAuth = Promise.resolve({ token: 'final-token' });
      return afterErrorAuth;
    });

  pipe(
    source,
    authExchange<{ token: string }>({
      getAuth,
      willAuthError,
      didAuthError: () => false,
      addAuthToOperation: ({ authState, operation }) => {
        return withAuthHeader(operation, authState?.token);
      },
    })(exchangeArgs),
    publish
  );

  await Promise.resolve();
  expect(getAuth).toHaveBeenCalledTimes(1);
  await initialAuth;
  await new Promise(res => {
    setTimeout(() => {
      res();
    });
  });

  next(queryOperation);
  expect(result).toHaveBeenCalledTimes(0);
  expect(willAuthError).toHaveBeenCalledTimes(1);
  expect(getAuth).toHaveBeenCalledTimes(2);

  await afterErrorAuth;

  await new Promise(res => {
    setTimeout(() => {
      res();
    });
  });

  expect(result).toHaveBeenCalledTimes(1);
  expect(operations.length).toBe(1);
  expect(operations[0]).toHaveProperty(
    'context.fetchOptions.headers.Authorization',
    'final-token'
  );
});

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
import { CombinedError, Client, Operation, OperationResult } from '@urql/core';
import { queryOperation } from '@urql/core/test-utils';

const makeExchangeArgs = () => {
  const operations: Operation[] = [];
  const result = jest.fn(
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

  return {
    ...operation,
    context: {
      ...operation.context,
      fetchOptions: {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          Authorization: token,
        },
      },
    },
  };
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

  const expectedOperation = {
    ...queryOperation,
    context: {
      ...queryOperation.context,
      authAttempt: false,
      fetchOptions: {
        ...(queryOperation.context.fetchOptions || {}),
        headers: {
          Authorization: 'my-token',
        },
      },
    },
  };

  expect(res).toEqual({ operation: expectedOperation });
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

  const expectedOperation = {
    ...queryOperation,
    context: {
      ...queryOperation.context,
      authAttempt: false,
      fetchOptions: {
        ...(queryOperation.context.fetchOptions || {}),
        headers: {
          Authorization: 'async-token',
        },
      },
    },
  };

  expect(res).toEqual({ operation: expectedOperation });
});

it('supports calls to the mutate() method in getAuth()', async () => {
  const { exchangeArgs } = makeExchangeArgs();

  const res = await pipe(
    fromValue(queryOperation),
    authExchange<{ token: string }>({
      getAuth: async ({ mutate }) => {
        const result = await mutate('mutation { auth }');
        expect(print(result.operation.query)).toBe('mutation {\n  auth\n}\n');
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

  const expectedOperation = {
    ...queryOperation,
    context: {
      ...queryOperation.context,
      authAttempt: false,
      fetchOptions: {
        ...(queryOperation.context.fetchOptions || {}),
        headers: {
          Authorization: 'async-token',
        },
      },
    },
  };

  expect(res).toEqual({ operation: expectedOperation });
});

it('adds the same token to subsequent operations', async () => {
  const { exchangeArgs } = makeExchangeArgs();
  const { source, next } = makeSubject<any>();

  const result = jest.fn();
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

  const secondQuery = {
    ...queryOperation,
    context: {
      ...queryOperation.context,
      foo: 'bar',
    },
  };

  next(secondQuery);

  await auth$;
  expect(result).toHaveBeenCalledTimes(2);

  expect(result).nthCalledWith(1, {
    operation: {
      ...queryOperation,
      context: {
        ...queryOperation.context,
        authAttempt: false,
        fetchOptions: {
          ...(queryOperation.context.fetchOptions || {}),
          headers: {
            Authorization: 'my-token',
          },
        },
      },
    },
  });

  expect(result).nthCalledWith(2, {
    operation: {
      ...secondQuery,
      context: {
        ...secondQuery.context,
        authAttempt: false,
        fetchOptions: {
          ...(secondQuery.context.fetchOptions || {}),
          headers: {
            Authorization: 'my-token',
          },
        },
      },
    },
  });
});

it('triggers authentication when an operation did error', async () => {
  const { exchangeArgs, result, operations } = makeExchangeArgs();
  const { source, next } = makeSubject<any>();

  let initialAuth;
  let afterErrorAuth;

  const didAuthError = jest.fn().mockReturnValueOnce(true);

  const getAuth = jest
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
  await Promise.resolve();
  await Promise.resolve();

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

  const willAuthError = jest
    .fn()
    .mockReturnValueOnce(true)
    .mockReturnValue(false);

  const getAuth = jest
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
  await Promise.resolve();
  await Promise.resolve();

  next(queryOperation);
  expect(result).toHaveBeenCalledTimes(0);
  expect(willAuthError).toHaveBeenCalledTimes(1);
  expect(getAuth).toHaveBeenCalledTimes(2);

  await afterErrorAuth;

  expect(result).toHaveBeenCalledTimes(1);
  expect(operations.length).toBe(1);
  expect(operations[0]).toHaveProperty(
    'context.fetchOptions.headers.Authorization',
    'final-token'
  );
});

import { pipe, fromValue, toPromise, take, makeSubject, tap, map } from 'wonka';

import { print } from 'graphql';
import { authExchange } from './authExchange';
import { Client, Operation, OperationResult } from '@urql/core';
import { queryOperation } from '@urql/core/test-utils';

const operations: Operation[] = [];
const exchangeArgs = {
  forward: op$ =>
    pipe(
      op$,
      map(
        (operation: Operation): OperationResult => {
          operations.push(operation);
          return { operation };
        }
      )
    ),
  client: new Client({ url: '/api' }),
} as any;

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

beforeEach(() => {
  operations.length = 0;
});

it('adds the auth header correctly', async () => {
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

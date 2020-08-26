import {
  pipe,
  fromValue,
  toPromise,
  take,
  makeSubject,
  tap,
  publish,
} from 'wonka';
import { authExchange } from './authExchange';
import { queryOperation } from '@urql/core/test-utils';

const exchangeArgs = {
  forward: a => a,
  client: {},
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

describe('on request', () => {
  it('does nothing when no parameters are passed in', async () => {
    const res = await pipe(
      fromValue(queryOperation),
      authExchange({
        getAuth: async () => null,
        willAuthError: () => false,
      })(exchangeArgs),
      take(1),
      toPromise
    );

    const withAuthAttempt = {
      ...queryOperation,
      context: {
        ...queryOperation.context,
        authAttempt: false,
      },
    };

    expect(res).toEqual(withAuthAttempt);
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

    expect(res).toEqual(expectedOperation);
  });

  it('adds the auth header correctly when it is fetched asynchronously', async () => {
    const res = await pipe(
      fromValue(queryOperation),
      authExchange({
        getAuth: async () => {
          return await new Promise<{ token: string }>(resolve =>
            setTimeout(() => resolve({ token: 'async-token' }), 500)
          );
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

    expect(res).toEqual(expectedOperation);
  });

  it('adds the same token to subsequent operations', async () => {
    const { source, next } = makeSubject<any>();

    const result = jest.fn();

    await pipe(
      source,
      authExchange({
        getAuth: async () => ({ token: 'my-token' }),
        willAuthError: () => false,
        addAuthToOperation: ({ authState, operation }) => {
          return withAuthHeader(operation, authState!.token);
        },
      })(exchangeArgs),
      tap(result),
      publish
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
    expect(result).toHaveBeenCalledTimes(2);
    expect(result).nthCalledWith(1, {
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
    });

    expect(result).nthCalledWith(2, {
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
    });
  });
});

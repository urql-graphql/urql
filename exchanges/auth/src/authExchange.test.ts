import {
  pipe,
  fromValue,
  toPromise,
  take,
  makeSubject,
  tap,
  publish,
  map,
} from 'wonka';
import { authExchange } from './authExchange';
import { queryOperation } from '@urql/core/test-utils';

const exchangeArgs = {
  forward: op$ =>
    pipe(
      op$,
      map(operation => ({ operation }))
    ),
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

    expect(res).toEqual({ operation: expectedOperation });
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
});

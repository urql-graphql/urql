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

describe('on request', () => {
  it('does nothing when no parameters are passed in', async () => {
    const res = await pipe(
      fromValue(queryOperation),
      authExchange({})(exchangeArgs),
      take(1),
      toPromise
    );

    expect(res).toEqual(queryOperation);
  });

  it('adds the auth header correctly', async () => {
    const res = await pipe(
      fromValue(queryOperation),
      authExchange({
        getInitialAuthState: () => ({ token: 'my-token' }),
        addAuthToOperation: ({ authState, operation }) => {
          return Object.assign(operation, {
            context: {
              fetchOptions: {
                headers: {
                  Authorization: `Bearer ${authState.token}`,
                },
              },
            },
          });
        },
      })(exchangeArgs),
      take(1),
      toPromise
    );

    const expectedOperation = {
      ...queryOperation,
      context: {
        ...queryOperation.context,
        fetchOptions: {
          ...(queryOperation.context.fetchOptions || {}),
          headers: {
            Authorization: 'Bearer my-token',
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
        getInitialAuthState: async () => {
          return await new Promise<{ token: string }>(resolve =>
            setTimeout(() => resolve({ token: 'async-token' }), 500)
          );
        },
        addAuthToOperation: ({ authState, operation }) => {
          return Object.assign(operation, {
            context: {
              fetchOptions: {
                headers: {
                  Authorization: authState.token,
                },
              },
            },
          });
        },
      })(exchangeArgs),
      take(1),
      toPromise
    );

    const expectedOperation = {
      ...queryOperation,
      context: {
        ...queryOperation.context,
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
        getInitialAuthState: () => ({ token: 'my-token' }),
        addAuthToOperation: ({ authState, operation }) => {
          return Object.assign(operation, {
            context: {
              fetchOptions: {
                headers: {
                  Authorization: `Bearer ${authState.token}`,
                },
              },
            },
          });
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
        fetchOptions: {
          ...(queryOperation.context.fetchOptions || {}),
          headers: {
            Authorization: 'Bearer my-token',
          },
        },
      },
    });

    expect(result).nthCalledWith(2, {
      ...secondQuery,
      context: {
        ...secondQuery.context,
        fetchOptions: {
          ...(secondQuery.context.fetchOptions || {}),
          headers: {
            Authorization: 'Bearer my-token',
          },
        },
      },
    });
  });
});

import {
  gql,
  createClient,
  ExchangeIO,
  Operation,
  OperationResult,
} from '@urql/core';
import { print } from 'graphql';
import { vi, expect, it, describe } from 'vitest';

import { pipe, map, makeSubject, tap, publish } from 'wonka';
import { offlineExchange } from './offlineExchange';

const mutationOne = gql`
  mutation {
    updateAuthor {
      id
      name
    }
  }
`;

const mutationOneData = {
  __typename: 'Mutation',
  updateAuthor: {
    __typename: 'Author',
    id: '123',
    name: 'Author',
  },
};

const queryOne = gql`
  query {
    authors {
      id
      name
      __typename
    }
  }
`;

const queryOneData = {
  __typename: 'Query',
  authors: [
    {
      id: '123',
      name: 'Me',
      __typename: 'Author',
    },
  ],
};

const dispatchDebug = vi.fn();

const storage = {
  onOnline: vi.fn(),
  writeData: vi.fn(() => Promise.resolve(undefined)),
  writeMetadata: vi.fn(() => Promise.resolve(undefined)),
  readData: vi.fn(() => Promise.resolve(undefined)),
  readMetadata: vi.fn(() => Promise.resolve(undefined)),
};

describe('storage', () => {
  it('should read the metadata and dispatch operations on initialization', () => {
    const client = createClient({ url: 'http://0.0.0.0' });
    const reexecuteOperation = vi
      .spyOn(client, 'reexecuteOperation')
      .mockImplementation(() => undefined);
    const op = client.createRequestOperation('mutation', {
      key: 1,
      query: mutationOne,
      variables: {},
    });

    const response = vi.fn(
      (forwardOp: Operation): OperationResult => {
        expect(forwardOp.key).toBe(op.key);
        return { operation: forwardOp, data: mutationOneData };
      }
    );

    const { source: ops$ } = makeSubject<Operation>();
    const result = vi.fn();
    const forward: ExchangeIO = ops$ => pipe(ops$, map(response));

    vi.useFakeTimers();
    pipe(
      offlineExchange({ storage })({ forward, client, dispatchDebug })(ops$),
      tap(result),
      publish
    );
    vi.runAllTimers();

    expect(storage.readMetadata).toBeCalledTimes(1);
    expect(reexecuteOperation).toBeCalledTimes(0);
  });
});

describe('offline', () => {
  it('should intercept errored mutations', () => {
    const onlineSpy = vi.spyOn(navigator, 'onLine', 'get');

    const client = createClient({ url: 'http://0.0.0.0' });
    const queryOp = client.createRequestOperation('query', {
      key: 1,
      query: queryOne,
      variables: {},
    });

    const mutationOp = client.createRequestOperation('mutation', {
      key: 2,
      query: mutationOne,
      variables: {},
    });

    const response = vi.fn(
      (forwardOp: Operation): OperationResult => {
        if (forwardOp.key === queryOp.key) {
          onlineSpy.mockReturnValueOnce(true);
          return { operation: forwardOp, data: queryOneData };
        } else {
          onlineSpy.mockReturnValueOnce(false);
          return {
            operation: forwardOp,
            // @ts-ignore
            error: { networkError: new Error('failed to fetch') },
          };
        }
      }
    );

    const { source: ops$, next } = makeSubject<Operation>();
    const result = vi.fn();
    const forward: ExchangeIO = ops$ => pipe(ops$, map(response));

    pipe(
      offlineExchange({
        storage,
        optimistic: {
          updateAuthor: () => ({
            id: '123',
            name: 'URQL',
            __typename: 'Author',
          }),
        },
      })({ forward, client, dispatchDebug })(ops$),
      tap(result),
      publish
    );

    next(queryOp);
    expect(result).toBeCalledTimes(1);
    expect(result.mock.calls[0][0].data).toMatchObject(queryOneData);

    next(mutationOp);
    expect(result).toBeCalledTimes(1);
    expect(storage.writeMetadata).toBeCalledTimes(1);
    expect(storage.writeMetadata).toHaveBeenCalledWith([
      {
        query: `mutation {
  updateAuthor {
    id
    name
    __typename
  }
}`,
        variables: {},
      },
    ]);

    next(queryOp);
    expect(result).toBeCalledTimes(2);
    expect(result.mock.calls[1][0].data).toMatchObject({
      authors: [{ id: '123', name: 'URQL', __typename: 'Author' }],
    });
  });

  it('should intercept errored queries', async () => {
    const client = createClient({ url: 'http://0.0.0.0' });
    const onlineSpy = vi
      .spyOn(navigator, 'onLine', 'get')
      .mockReturnValueOnce(false);

    const queryOp = client.createRequestOperation('query', {
      key: 1,
      query: queryOne,
    });

    const response = vi.fn(
      (forwardOp: Operation): OperationResult => {
        onlineSpy.mockReturnValueOnce(false);
        return {
          operation: forwardOp,
          // @ts-ignore
          error: { networkError: new Error('failed to fetch') },
        };
      }
    );

    const { source: ops$, next } = makeSubject<Operation>();
    const result = vi.fn();
    const forward: ExchangeIO = ops$ => pipe(ops$, map(response));

    pipe(
      offlineExchange({ storage })({ forward, client, dispatchDebug })(ops$),
      tap(result),
      publish
    );

    next(queryOp);

    expect(result).toBeCalledTimes(1);
    expect(response).toBeCalledTimes(1);

    expect(result.mock.calls[0][0]).toEqual({
      data: null,
      error: undefined,
      extensions: undefined,
      operation: expect.any(Object),
    });

    expect(result.mock.calls[0][0]).toHaveProperty(
      'operation.context.meta.cacheOutcome',
      'miss'
    );
  });

  it('should flush the queue when we become online', () => {
    let flush: () => {};
    storage.onOnline.mockImplementation(cb => {
      flush = cb;
    });

    const onlineSpy = vi.spyOn(navigator, 'onLine', 'get');

    const client = createClient({ url: 'http://0.0.0.0' });
    const reexecuteOperation = vi
      .spyOn(client, 'reexecuteOperation')
      .mockImplementation(() => undefined);

    const mutationOp = client.createRequestOperation('mutation', {
      key: 1,
      query: mutationOne,
      variables: {},
    });

    const response = vi.fn(
      (forwardOp: Operation): OperationResult => {
        onlineSpy.mockReturnValueOnce(false);
        return {
          operation: forwardOp,
          // @ts-ignore
          error: { networkError: new Error('failed to fetch') },
        };
      }
    );

    const { source: ops$, next } = makeSubject<Operation>();
    const result = vi.fn();
    const forward: ExchangeIO = ops$ => pipe(ops$, map(response));

    pipe(
      offlineExchange({
        storage,
        optimistic: {
          updateAuthor: () => ({
            id: '123',
            name: 'URQL',
            __typename: 'Author',
          }),
        },
      })({ forward, client, dispatchDebug })(ops$),
      tap(result),
      publish
    );

    next(mutationOp);
    expect(storage.writeMetadata).toBeCalledTimes(1);
    expect(storage.writeMetadata).toHaveBeenCalledWith([
      {
        query: `mutation {
  updateAuthor {
    id
    name
    __typename
  }
}`,
        variables: {},
      },
    ]);

    flush!();
    expect(reexecuteOperation).toHaveBeenCalledTimes(1);
    expect((reexecuteOperation.mock.calls[0][0] as any).key).toEqual(1);
    expect(print((reexecuteOperation.mock.calls[0][0] as any).query)).toEqual(
      print(gql`
        mutation {
          updateAuthor {
            id
            name
            __typename
          }
        }
      `)
    );
  });
});

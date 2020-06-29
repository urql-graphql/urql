import {
  createClient,
  ExchangeIO,
  Operation,
  OperationResult,
  formatDocument,
} from '@urql/core';

import gql from 'graphql-tag';
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
    }
  }
`;

const queryOneData = {
  __typename: 'Query',
  authors: [
    {
      __typename: 'Author',
      id: '123',
      name: 'Me',
    },
  ],
};

const dispatchDebug = jest.fn();

describe('storage', () => {
  const storage = {
    onOnline: jest.fn(),
    writeData: jest.fn(),
    writeMetadata: jest.fn(),
    readData: jest.fn(),
    readMetadata: jest.fn(),
  };

  it('should read the metadata and dispatch operations on initialization', () => {
    const client = createClient({ url: 'http://0.0.0.0' });
    const dispatchOperationSpy = jest.spyOn(client, 'dispatchOperation');
    const op = client.createRequestOperation('mutation', {
      key: 1,
      query: mutationOne,
      variables: {},
    });

    const response = jest.fn(
      (forwardOp: Operation): OperationResult => {
        expect(forwardOp.key).toBe(op.key);
        return { operation: forwardOp, data: mutationOneData };
      }
    );

    const { source: ops$ } = makeSubject<Operation>();
    const result = jest.fn();
    const forward: ExchangeIO = ops$ => pipe(ops$, map(response));

    storage.readData.mockReturnValueOnce({ then: () => undefined });
    storage.readMetadata.mockReturnValueOnce({ then: cb => cb([op]) });
    dispatchOperationSpy.mockImplementation(() => undefined);

    jest.useFakeTimers();
    pipe(
      offlineExchange({ storage })({ forward, client, dispatchDebug })(ops$),
      tap(result),
      publish
    );
    jest.runAllTimers();

    expect(storage.readMetadata).toBeCalledTimes(1);
    expect(dispatchOperationSpy).toBeCalledTimes(1);
    expect(dispatchOperationSpy).toBeCalledWith({
      ...op,
      key: expect.any(Number),
    });
  });
});

describe('offline', () => {
  const storage = {
    onOnline: jest.fn(),
    writeData: jest.fn(),
    writeMetadata: jest.fn(),
    readData: jest.fn(),
    readMetadata: jest.fn(),
  };

  it('should intercept errored mutations', () => {
    const onlineSpy = jest.spyOn(navigator, 'onLine', 'get');

    const client = createClient({ url: 'http://0.0.0.0' });
    const queryOp = client.createRequestOperation('query', {
      key: 1,
      query: queryOne,
    });

    const mutationOp = client.createRequestOperation('mutation', {
      key: 2,
      query: mutationOne,
      variables: {},
    });

    const response = jest.fn(
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
    const result = jest.fn();
    const forward: ExchangeIO = ops$ => pipe(ops$, map(response));

    storage.readData.mockReturnValueOnce({ then: () => undefined });
    storage.readMetadata.mockReturnValueOnce({ then: () => undefined });
    storage.writeMetadata.mockReturnValueOnce({ then: () => undefined });

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
    expect(result.mock.calls[0][0].data).toEqual(queryOneData);

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
}
`,
        variables: {},
      },
    ]);

    next(queryOp);
    expect(result).toBeCalledTimes(2);
    expect(result.mock.calls[1][0].data).toEqual({
      __typename: 'Query',
      authors: [{ id: '123', name: 'URQL', __typename: 'Author' }],
    });
  });

  it('should flush the queue when we become online', () => {
    let flush: () => {};
    storage.onOnline.mockImplementation(cb => {
      flush = cb;
    });

    const onlineSpy = jest.spyOn(navigator, 'onLine', 'get');

    const client = createClient({ url: 'http://0.0.0.0' });
    const dispatchOperationSpy = jest
      .spyOn(client, 'dispatchOperation')
      .mockImplementation(() => undefined);

    const mutationOp = client.createRequestOperation('mutation', {
      key: 1,
      query: mutationOne,
      variables: {},
    });

    const response = jest.fn(
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
    const result = jest.fn();
    const forward: ExchangeIO = ops$ => pipe(ops$, map(response));

    storage.readData.mockReturnValueOnce({ then: () => undefined });
    storage.readMetadata.mockReturnValueOnce({ then: () => undefined });
    storage.writeMetadata.mockReturnValueOnce({ then: () => undefined });

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
}
`,
        variables: {},
      },
    ]);

    flush!();
    expect(dispatchOperationSpy).toHaveBeenCalledTimes(1);
    expect((dispatchOperationSpy.mock.calls[0][0] as any).key).toEqual(1);
    expect((dispatchOperationSpy.mock.calls[0][0] as any).query).toEqual(
      formatDocument(mutationOp.query)
    );
  });
});

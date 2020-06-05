import gql from 'graphql-tag';
import {
  createClient,
  ExchangeIO,
  Operation,
  OperationResult,
} from '@urql/core';
import { pipe, map, makeSubject, tap, publish } from 'wonka';
import { offlineExchange } from './offlineExchange';

const mutationOne = gql`
  mutation {
    addAuthor {
      id
      name
    }
  }
`;

const mutationOneData = {
  __typename: 'Mutation',
  addAuthor: {
    __typename: 'Author',
    id: '123',
    name: 'Author',
  },
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

  beforeEach(() => {
    (navigator as any).onLine = false;
  });

  afterEach(() => {
    (navigator as any).onLine = true;
  });

  it('should intercept errored mutations', () => {
    // TODO: query --> mutation --> error response --> query (expect optimistic data)
    const client = createClient({ url: 'http://0.0.0.0' });
    const op = client.createRequestOperation('mutation', {
      key: 1,
      query: mutationOne,
      variables: {},
    });

    const response = jest.fn(
      (forwardOp: Operation): OperationResult => {
        expect(forwardOp.key).toBe(op.key);
        // @ts-ignore
        return { operation: forwardOp, error: new Error('') };
      }
    );

    const { source: ops$, next } = makeSubject<Operation>();
    const result = jest.fn();
    const forward: ExchangeIO = ops$ => pipe(ops$, map(response));

    storage.readData.mockReturnValueOnce({ then: () => undefined });
    storage.readMetadata.mockReturnValueOnce({ then: () => undefined });

    pipe(
      offlineExchange({
        storage,
        optimistic: {
          addAuthor: () => ({ id: '123', name: 'URQL', __typename: 'Author' }),
        },
      })({ forward, client, dispatchDebug })(ops$),
      tap(result),
      publish
    );

    next(op);
  });
});

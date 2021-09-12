import {
  gql,
  createClient,
  ExchangeIO,
  Operation,
  OperationResult,
  CombinedError,
} from '@urql/core';

import {
  Source,
  pipe,
  map,
  merge,
  mergeMap,
  filter,
  fromValue,
  makeSubject,
  tap,
  publish,
  delay,
} from 'wonka';

import { minifyIntrospectionQuery } from '@urql/introspection';
import { cacheExchange } from './cacheExchange';

const queryOne = gql`
  {
    author {
      id
      name
    }
    unrelated {
      id
    }
  }
`;

const queryOneData = {
  __typename: 'Query',
  author: {
    __typename: 'Author',
    id: '123',
    name: 'Author',
  },
  unrelated: {
    __typename: 'Unrelated',
    id: 'unrelated',
  },
};

const dispatchDebug = jest.fn();

describe('data dependencies', () => {
  it('writes queries to the cache', () => {
    const client = createClient({ url: 'http://0.0.0.0' });
    const op = client.createRequestOperation('query', {
      key: 1,
      query: queryOne,
    });

    const response = jest.fn(
      (forwardOp: Operation): OperationResult => {
        expect(forwardOp.key).toBe(op.key);
        return { operation: forwardOp, data: queryOneData };
      }
    );

    const { source: ops$, next } = makeSubject<Operation>();
    const result = jest.fn();
    const forward: ExchangeIO = ops$ => pipe(ops$, map(response));

    pipe(
      cacheExchange({})({ forward, client, dispatchDebug })(ops$),
      tap(result),
      publish
    );

    next(op);
    next(op);
    expect(response).toHaveBeenCalledTimes(1);
    expect(result).toHaveBeenCalledTimes(2);

    expect(result.mock.calls[0][0]).toHaveProperty(
      'operation.context.meta.cacheOutcome',
      'miss'
    );
    expect(result.mock.calls[1][0]).toHaveProperty(
      'operation.context.meta.cacheOutcome',
      'hit'
    );
  });

  it('respects cache-only operations', () => {
    const client = createClient({ url: 'http://0.0.0.0' });
    const op = client.createRequestOperation(
      'query',
      {
        key: 1,
        query: queryOne,
      },
      {
        requestPolicy: 'cache-only',
      }
    );

    const response = jest.fn(
      (forwardOp: Operation): OperationResult => {
        expect(forwardOp.key).toBe(op.key);
        return { operation: forwardOp, data: queryOneData };
      }
    );

    const { source: ops$, next } = makeSubject<Operation>();
    const result = jest.fn();
    const forward: ExchangeIO = ops$ => pipe(ops$, map(response));

    pipe(
      cacheExchange({})({ forward, client, dispatchDebug })(ops$),
      tap(result),
      publish
    );

    next(op);
    expect(response).toHaveBeenCalledTimes(0);
    expect(result).toHaveBeenCalledTimes(1);

    expect(result.mock.calls[0][0]).toHaveProperty(
      'operation.context.meta.cacheOutcome',
      'miss'
    );

    expect(result.mock.calls[0][0].data).toBe(null);
  });

  it('updates related queries when their data changes', () => {
    const queryMultiple = gql`
      {
        authors {
          id
          name
        }
      }
    `;

    const queryMultipleData = {
      __typename: 'Query',
      authors: [
        {
          __typename: 'Author',
          id: '123',
          name: 'New Author Name',
        },
      ],
    };

    const client = createClient({ url: 'http://0.0.0.0' });
    const { source: ops$, next } = makeSubject<Operation>();

    const reexec = jest
      .spyOn(client, 'reexecuteOperation')
      .mockImplementation(next);

    const opOne = client.createRequestOperation('query', {
      key: 1,
      query: queryOne,
    });

    const opMultiple = client.createRequestOperation('query', {
      key: 2,
      query: queryMultiple,
    });

    const response = jest.fn(
      (forwardOp: Operation): OperationResult => {
        if (forwardOp.key === 1) {
          return { operation: opOne, data: queryOneData };
        } else if (forwardOp.key === 2) {
          return { operation: opMultiple, data: queryMultipleData };
        }

        return undefined as any;
      }
    );

    const forward: ExchangeIO = ops$ => pipe(ops$, map(response));
    const result = jest.fn();

    pipe(
      cacheExchange({})({ forward, client, dispatchDebug })(ops$),
      tap(result),
      publish
    );

    next(opOne);
    expect(response).toHaveBeenCalledTimes(1);
    expect(result).toHaveBeenCalledTimes(1);

    next(opMultiple);
    expect(response).toHaveBeenCalledTimes(2);
    expect(reexec).toHaveBeenCalledWith(opOne);
    expect(result).toHaveBeenCalledTimes(3);

    // test for reference reuse
    const firstDataOne = result.mock.calls[0][0].data;
    const firstDataTwo = result.mock.calls[1][0].data;
    expect(firstDataOne).not.toBe(firstDataTwo);
    expect(firstDataOne.author).not.toBe(firstDataTwo.author);
    expect(firstDataOne.unrelated).toBe(firstDataTwo.unrelated);
  });

  it('updates related queries when a mutation update touches query data', () => {
    jest.useFakeTimers();

    const balanceFragment = gql`
      fragment BalanceFragment on Author {
        id
        balance {
          amount
        }
      }
    `;

    const queryById = gql`
      query($id: ID!) {
        author(id: $id) {
          id
          name
          ...BalanceFragment
        }
      }

      ${balanceFragment}
    `;

    const queryByIdDataA = {
      __typename: 'Query',
      author: {
        __typename: 'Author',
        id: '1',
        name: 'Author 1',
        balance: {
          __typename: 'Balance',
          amount: 100,
        },
      },
    };

    const queryByIdDataB = {
      __typename: 'Query',
      author: {
        __typename: 'Author',
        id: '2',
        name: 'Author 2',
        balance: {
          __typename: 'Balance',
          amount: 200,
        },
      },
    };

    const mutation = gql`
      mutation($userId: ID!, $amount: Int!) {
        updateBalance(userId: $userId, amount: $amount) {
          userId
          balance {
            amount
          }
        }
      }
    `;

    const mutationData = {
      __typename: 'Mutation',
      updateBalance: {
        __typename: 'UpdateBalanceResult',
        userId: '1',
        balance: {
          __typename: 'Balance',
          amount: 1000,
        },
      },
    };

    const client = createClient({ url: 'http://0.0.0.0' });
    const { source: ops$, next } = makeSubject<Operation>();

    const reexec = jest
      .spyOn(client, 'reexecuteOperation')
      .mockImplementation(next);

    const opOne = client.createRequestOperation('query', {
      key: 1,
      query: queryById,
      variables: { id: 1 },
    });

    const opTwo = client.createRequestOperation('query', {
      key: 2,
      query: queryById,
      variables: { id: 2 },
    });

    const opMutation = client.createRequestOperation('mutation', {
      key: 3,
      query: mutation,
      variables: { userId: '1', amount: 1000 },
    });

    const response = jest.fn(
      (forwardOp: Operation): OperationResult => {
        if (forwardOp.key === 1) {
          return { operation: opOne, data: queryByIdDataA };
        } else if (forwardOp.key === 2) {
          return { operation: opTwo, data: queryByIdDataB };
        } else if (forwardOp.key === 3) {
          return { operation: opMutation, data: mutationData };
        }

        return undefined as any;
      }
    );

    const result = jest.fn();
    const forward: ExchangeIO = ops$ => pipe(ops$, delay(1), map(response));

    const updates = {
      Mutation: {
        updateBalance: jest.fn((result, _args, cache) => {
          const {
            updateBalance: { userId, balance },
          } = result;
          cache.writeFragment(balanceFragment, { id: userId, balance });
        }),
      },
    };

    const keys = {
      Balance: () => null,
    };

    pipe(
      cacheExchange({ updates, keys })({ forward, client, dispatchDebug })(
        ops$
      ),
      tap(result),
      publish
    );

    next(opTwo);
    jest.runAllTimers();
    expect(response).toHaveBeenCalledTimes(1);

    next(opOne);
    jest.runAllTimers();
    expect(response).toHaveBeenCalledTimes(2);

    next(opMutation);
    jest.runAllTimers();

    expect(response).toHaveBeenCalledTimes(3);
    expect(updates.Mutation.updateBalance).toHaveBeenCalledTimes(1);

    expect(reexec).toHaveBeenCalledTimes(1);
    expect(reexec.mock.calls[0][0].key).toBe(1);

    expect(result.mock.calls[2][0]).toHaveProperty(
      'data.author.balance.amount',
      1000
    );
  });

  it('does nothing when no related queries have changed', () => {
    const queryUnrelated = gql`
      {
        user {
          id
          name
        }
      }
    `;

    const queryUnrelatedData = {
      __typename: 'Query',
      user: {
        __typename: 'User',
        id: 'me',
        name: 'Me',
      },
    };

    const client = createClient({ url: 'http://0.0.0.0' });
    const { source: ops$, next } = makeSubject<Operation>();
    const reexec = jest
      .spyOn(client, 'reexecuteOperation')
      .mockImplementation(next);

    const opOne = client.createRequestOperation('query', {
      key: 1,
      query: queryOne,
    });
    const opUnrelated = client.createRequestOperation('query', {
      key: 2,
      query: queryUnrelated,
    });

    const response = jest.fn(
      (forwardOp: Operation): OperationResult => {
        if (forwardOp.key === 1) {
          return { operation: opOne, data: queryOneData };
        } else if (forwardOp.key === 2) {
          return { operation: opUnrelated, data: queryUnrelatedData };
        }

        return undefined as any;
      }
    );

    const forward: ExchangeIO = ops$ => pipe(ops$, map(response));
    const result = jest.fn();

    pipe(
      cacheExchange({})({ forward, client, dispatchDebug })(ops$),
      tap(result),
      publish
    );

    next(opOne);
    expect(response).toHaveBeenCalledTimes(1);

    next(opUnrelated);
    expect(response).toHaveBeenCalledTimes(2);

    expect(reexec).not.toHaveBeenCalled();
    expect(result).toHaveBeenCalledTimes(2);
  });

  it('does not reach updater when mutation has no selectionset in optimistic phase', () => {
    jest.useFakeTimers();

    const mutation = gql`
      mutation {
        concealAuthor
      }
    `;

    const mutationData = {
      __typename: 'Mutation',
      concealAuthor: true,
    };

    const client = createClient({ url: 'http://0.0.0.0' });
    const { source: ops$, next } = makeSubject<Operation>();

    jest.spyOn(client, 'reexecuteOperation').mockImplementation(next);

    const opMutation = client.createRequestOperation('mutation', {
      key: 1,
      query: mutation,
    });

    const response = jest.fn(
      (forwardOp: Operation): OperationResult => {
        if (forwardOp.key === 1) {
          return { operation: opMutation, data: mutationData };
        }

        return undefined as any;
      }
    );

    const result = jest.fn();
    const forward: ExchangeIO = ops$ => pipe(ops$, delay(1), map(response));

    const updates = {
      Mutation: {
        concealAuthor: jest.fn(),
      },
    };

    pipe(
      cacheExchange({ updates })({ forward, client, dispatchDebug })(ops$),
      tap(result),
      publish
    );

    next(opMutation);
    expect(updates.Mutation.concealAuthor).toHaveBeenCalledTimes(0);

    jest.runAllTimers();
    expect(updates.Mutation.concealAuthor).toHaveBeenCalledTimes(1);
  });

  it('does reach updater when mutation has no selectionset in optimistic phase with optimistic update', () => {
    jest.useFakeTimers();

    const mutation = gql`
      mutation {
        concealAuthor
      }
    `;

    const mutationData = {
      __typename: 'Mutation',
      concealAuthor: true,
    };

    const client = createClient({ url: 'http://0.0.0.0' });
    const { source: ops$, next } = makeSubject<Operation>();

    jest.spyOn(client, 'reexecuteOperation').mockImplementation(next);

    const opMutation = client.createRequestOperation('mutation', {
      key: 1,
      query: mutation,
    });

    const response = jest.fn(
      (forwardOp: Operation): OperationResult => {
        if (forwardOp.key === 1) {
          return { operation: opMutation, data: mutationData };
        }

        return undefined as any;
      }
    );

    const result = jest.fn();
    const forward: ExchangeIO = ops$ => pipe(ops$, delay(1), map(response));

    const updates = {
      Mutation: {
        concealAuthor: jest.fn(),
      },
    };

    const optimistic = {
      concealAuthor: jest.fn(() => true) as any,
    };

    pipe(
      cacheExchange({ updates, optimistic })({
        forward,
        client,
        dispatchDebug,
      })(ops$),
      tap(result),
      publish
    );

    next(opMutation);
    expect(optimistic.concealAuthor).toHaveBeenCalledTimes(1);
    expect(updates.Mutation.concealAuthor).toHaveBeenCalledTimes(1);

    jest.runAllTimers();
    expect(updates.Mutation.concealAuthor).toHaveBeenCalledTimes(2);
  });

  it('respects aliases in the optimistic update data that is written', () => {
    jest.useFakeTimers();

    const mutation = gql`
      mutation {
        concealed: concealAuthor
      }
    `;

    const mutationData = {
      __typename: 'Mutation',
      concealed: true,
    };

    const client = createClient({ url: 'http://0.0.0.0' });
    const { source: ops$, next } = makeSubject<Operation>();

    jest.spyOn(client, 'reexecuteOperation').mockImplementation(next);

    const opMutation = client.createRequestOperation('mutation', {
      key: 1,
      query: mutation,
    });

    const response = jest.fn(
      (forwardOp: Operation): OperationResult => {
        if (forwardOp.key === 1) {
          return { operation: opMutation, data: mutationData };
        }

        return undefined as any;
      }
    );

    const result = jest.fn();
    const forward: ExchangeIO = ops$ => pipe(ops$, delay(1), map(response));

    const updates = {
      Mutation: {
        concealAuthor: jest.fn(),
      },
    };

    const optimistic = {
      concealAuthor: jest.fn(() => true) as any,
    };

    pipe(
      cacheExchange({ updates, optimistic })({
        forward,
        client,
        dispatchDebug,
      })(ops$),
      tap(result),
      publish
    );

    next(opMutation);
    expect(optimistic.concealAuthor).toHaveBeenCalledTimes(1);
    expect(updates.Mutation.concealAuthor).toHaveBeenCalledTimes(1);

    const data = updates.Mutation.concealAuthor.mock.calls[0][0];
    // Expect both fields to exist
    expect(data.concealed).toBe(true);
    expect(data.concealAuthor).toBe(true);

    jest.runAllTimers();
    expect(updates.Mutation.concealAuthor).toHaveBeenCalledTimes(2);
  });

  it('marks errored null fields as uncached but delivers them as expected', () => {
    const client = createClient({ url: 'http://0.0.0.0' });
    const { source: ops$, next } = makeSubject<Operation>();

    const query = gql`
      {
        field
        author {
          id
        }
      }
    `;

    const operation = client.createRequestOperation('query', {
      key: 1,
      query,
    });

    const queryResult: OperationResult = {
      operation,
      data: {
        __typename: 'Query',
        field: 'test',
        author: null,
      },
      error: new CombinedError({
        graphQLErrors: [
          {
            message: 'Test',
            path: ['author'],
          },
        ],
      }),
    };

    const reexecuteOperation = jest
      .spyOn(client, 'reexecuteOperation')
      .mockImplementation(next);

    const response = jest.fn(
      (forwardOp: Operation): OperationResult => {
        if (forwardOp.key === 1) return queryResult;
        return undefined as any;
      }
    );

    const result = jest.fn();
    const forward: ExchangeIO = ops$ => pipe(ops$, map(response));

    pipe(
      cacheExchange({})({ forward, client, dispatchDebug })(ops$),
      tap(result),
      publish
    );

    next(operation);

    expect(response).toHaveBeenCalledTimes(1);
    expect(result).toHaveBeenCalledTimes(1);
    expect(reexecuteOperation).toHaveBeenCalledTimes(0);
    expect(result.mock.calls[0][0]).toHaveProperty('data.author', null);
  });
});

describe('optimistic updates', () => {
  it('writes optimistic mutations to the cache', () => {
    jest.useFakeTimers();

    const mutation = gql`
      mutation {
        concealAuthor {
          id
          name
        }
      }
    `;

    const optimisticMutationData = {
      __typename: 'Mutation',
      concealAuthor: {
        __typename: 'Author',
        id: '123',
        name: '[REDACTED OFFLINE]',
      },
    };

    const mutationData = {
      __typename: 'Mutation',
      concealAuthor: {
        __typename: 'Author',
        id: '123',
        name: '[REDACTED ONLINE]',
      },
    };

    const client = createClient({ url: 'http://0.0.0.0' });
    const { source: ops$, next } = makeSubject<Operation>();

    const reexec = jest
      .spyOn(client, 'reexecuteOperation')
      .mockImplementation(next);

    const opOne = client.createRequestOperation('query', {
      key: 1,
      query: queryOne,
    });

    const opMutation = client.createRequestOperation('mutation', {
      key: 2,
      query: mutation,
    });

    const response = jest.fn(
      (forwardOp: Operation): OperationResult => {
        if (forwardOp.key === 1) {
          return { operation: opOne, data: queryOneData };
        } else if (forwardOp.key === 2) {
          return { operation: opMutation, data: mutationData };
        }

        return undefined as any;
      }
    );

    const result = jest.fn();
    const forward: ExchangeIO = ops$ => pipe(ops$, delay(1), map(response));

    const optimistic = {
      concealAuthor: jest.fn(() => optimisticMutationData.concealAuthor) as any,
    };

    pipe(
      cacheExchange({ optimistic })({ forward, client, dispatchDebug })(ops$),
      tap(result),
      publish
    );

    next(opOne);
    jest.runAllTimers();
    expect(response).toHaveBeenCalledTimes(1);

    next(opMutation);
    expect(response).toHaveBeenCalledTimes(1);
    expect(optimistic.concealAuthor).toHaveBeenCalledTimes(1);
    expect(reexec).toHaveBeenCalledTimes(1);

    jest.runAllTimers();
    expect(response).toHaveBeenCalledTimes(2);
    expect(result).toHaveBeenCalledTimes(4);
  });

  it('batches optimistic mutation result application', () => {
    jest.useFakeTimers();

    const mutation = gql`
      mutation {
        concealAuthor {
          id
          name
        }
      }
    `;

    const optimisticMutationData = {
      __typename: 'Mutation',
      concealAuthor: {
        __typename: 'Author',
        id: '123',
        name: '[REDACTED OFFLINE]',
      },
    };

    const mutationData = {
      __typename: 'Mutation',
      concealAuthor: {
        __typename: 'Author',
        id: '123',
        name: '[REDACTED ONLINE]',
      },
    };

    const client = createClient({ url: 'http://0.0.0.0' });
    const { source: ops$, next } = makeSubject<Operation>();

    const reexec = jest
      .spyOn(client, 'reexecuteOperation')
      .mockImplementation(next);

    const opOne = client.createRequestOperation('query', {
      key: 1,
      query: queryOne,
    });

    const opMutationOne = client.createRequestOperation('mutation', {
      key: 2,
      query: mutation,
    });

    const opMutationTwo = client.createRequestOperation('mutation', {
      key: 3,
      query: mutation,
    });

    const response = jest.fn(
      (forwardOp: Operation): OperationResult => {
        if (forwardOp.key === 1) {
          return { operation: opOne, data: queryOneData };
        } else if (forwardOp.key === 2) {
          return { operation: opMutationOne, data: mutationData };
        } else if (forwardOp.key === 3) {
          return { operation: opMutationTwo, data: mutationData };
        }

        return undefined as any;
      }
    );

    const result = jest.fn();
    const forward: ExchangeIO = ops$ => pipe(ops$, delay(3), map(response));

    const optimistic = {
      concealAuthor: jest.fn(() => optimisticMutationData.concealAuthor) as any,
    };

    pipe(
      cacheExchange({ optimistic })({ forward, client, dispatchDebug })(ops$),
      filter(x => x.operation.kind === 'mutation'),
      tap(result),
      publish
    );

    next(opOne);
    jest.runAllTimers();
    expect(response).toHaveBeenCalledTimes(1);
    expect(result).toHaveBeenCalledTimes(0);

    next(opMutationOne);
    jest.advanceTimersByTime(1);
    next(opMutationTwo);

    expect(response).toHaveBeenCalledTimes(1);
    expect(optimistic.concealAuthor).toHaveBeenCalledTimes(2);
    expect(reexec).toHaveBeenCalledTimes(2);
    expect(result).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(2);
    expect(response).toHaveBeenCalledTimes(2);
    expect(result).toHaveBeenCalledTimes(0);

    jest.runAllTimers();
    expect(response).toHaveBeenCalledTimes(3);
    expect(result).toHaveBeenCalledTimes(2);
  });

  it('blocks refetches of overlapping queries', () => {
    jest.useFakeTimers();

    const mutation = gql`
      mutation {
        concealAuthor {
          id
          name
        }
      }
    `;

    const optimisticMutationData = {
      __typename: 'Mutation',
      concealAuthor: {
        __typename: 'Author',
        id: '123',
        name: '[REDACTED OFFLINE]',
      },
    };

    const client = createClient({ url: 'http://0.0.0.0' });
    const { source: ops$, next } = makeSubject<Operation>();

    const reexec = jest
      .spyOn(client, 'reexecuteOperation')
      .mockImplementation(next);

    const opOne = client.createRequestOperation(
      'query',
      {
        key: 1,
        query: queryOne,
      },
      {
        requestPolicy: 'cache-and-network',
      }
    );

    const opMutation = client.createRequestOperation('mutation', {
      key: 2,
      query: mutation,
    });

    const response = jest.fn(
      (forwardOp: Operation): OperationResult => {
        if (forwardOp.key === 1) {
          return { operation: opOne, data: queryOneData };
        }

        return undefined as any;
      }
    );

    const result = jest.fn();
    const forward: ExchangeIO = ops$ =>
      pipe(
        ops$,
        delay(1),
        filter(x => x.kind !== 'mutation'),
        map(response)
      );

    const optimistic = {
      concealAuthor: jest.fn(() => optimisticMutationData.concealAuthor) as any,
    };

    pipe(
      cacheExchange({ optimistic })({ forward, client, dispatchDebug })(ops$),
      tap(result),
      publish
    );

    next(opOne);
    jest.runAllTimers();
    expect(response).toHaveBeenCalledTimes(1);

    next(opMutation);
    expect(response).toHaveBeenCalledTimes(1);
    expect(optimistic.concealAuthor).toHaveBeenCalledTimes(1);
    expect(reexec).toHaveBeenCalledTimes(1);

    expect(reexec.mock.calls[0][0]).toHaveProperty(
      'context.requestPolicy',
      'cache-first'
    );

    jest.runAllTimers();
    expect(response).toHaveBeenCalledTimes(1);

    next(opOne);
    expect(response).toHaveBeenCalledTimes(1);
    expect(reexec).toHaveBeenCalledTimes(1);
  });

  it('correctly clears on error', () => {
    jest.useFakeTimers();

    const authorsQuery = gql`
      query {
        authors {
          id
          name
        }
      }
    `;

    const authorsQueryData = {
      __typename: 'Query',
      authors: [
        {
          __typename: 'Author',
          id: '1',
          name: 'Author',
        },
      ],
    };

    const mutation = gql`
      mutation {
        addAuthor {
          id
          name
        }
      }
    `;

    const optimisticMutationData = {
      __typename: 'Mutation',
      addAuthor: {
        __typename: 'Author',
        id: '123',
        name: '[REDACTED OFFLINE]',
      },
    };

    const client = createClient({ url: 'http://0.0.0.0' });
    const { source: ops$, next } = makeSubject<Operation>();

    const reexec = jest
      .spyOn(client, 'reexecuteOperation')
      .mockImplementation(next);

    const opOne = client.createRequestOperation('query', {
      key: 1,
      query: authorsQuery,
    });

    const opMutation = client.createRequestOperation('mutation', {
      key: 2,
      query: mutation,
    });

    const response = jest.fn(
      (forwardOp: Operation): OperationResult => {
        if (forwardOp.key === 1) {
          return { operation: opOne, data: authorsQueryData };
        } else if (forwardOp.key === 2) {
          return {
            operation: opMutation,
            error: 'error' as any,
            data: { __typename: 'Mutation', addAuthor: null },
          };
        }

        return undefined as any;
      }
    );

    const result = jest.fn();
    const forward: ExchangeIO = ops$ => pipe(ops$, delay(1), map(response));

    const optimistic = {
      addAuthor: jest.fn(() => optimisticMutationData.addAuthor) as any,
    };

    const updates = {
      Mutation: {
        addAuthor: jest.fn((data, _, cache) => {
          cache.updateQuery({ query: authorsQuery }, (prevData: any) => ({
            ...prevData,
            authors: [...prevData.authors, data.addAuthor],
          }));
        }),
      },
    };

    pipe(
      cacheExchange({ optimistic, updates })({
        forward,
        client,
        dispatchDebug,
      })(ops$),
      tap(result),
      publish
    );

    next(opOne);
    jest.runAllTimers();
    expect(response).toHaveBeenCalledTimes(1);

    next(opMutation);
    expect(response).toHaveBeenCalledTimes(1);
    expect(optimistic.addAuthor).toHaveBeenCalledTimes(1);
    expect(updates.Mutation.addAuthor).toHaveBeenCalledTimes(1);
    expect(reexec).toHaveBeenCalledTimes(1);

    jest.runAllTimers();

    expect(updates.Mutation.addAuthor).toHaveBeenCalledTimes(2);
    expect(response).toHaveBeenCalledTimes(2);
    expect(result).toHaveBeenCalledTimes(4);
  });
});

describe('custom resolvers', () => {
  it('follows resolvers on initial write', () => {
    const client = createClient({ url: 'http://0.0.0.0' });
    const { source: ops$, next } = makeSubject<Operation>();

    const opOne = client.createRequestOperation('query', {
      key: 1,
      query: queryOne,
    });

    const response = jest.fn(
      (forwardOp: Operation): OperationResult => {
        if (forwardOp.key === 1) {
          return { operation: opOne, data: queryOneData };
        }

        return undefined as any;
      }
    );

    const forward: ExchangeIO = ops$ => pipe(ops$, map(response));

    const result = jest.fn();
    const fakeResolver = jest.fn();

    pipe(
      cacheExchange({
        resolvers: {
          Author: {
            name: () => {
              fakeResolver();
              return 'newName';
            },
          },
        },
      })({ forward, client, dispatchDebug })(ops$),
      tap(result),
      publish
    );

    next(opOne);
    expect(response).toHaveBeenCalledTimes(1);
    expect(fakeResolver).toHaveBeenCalledTimes(1);
    expect(result).toHaveBeenCalledTimes(1);
    expect(result.mock.calls[0][0].data).toMatchObject({
      author: {
        id: '123',
        name: 'newName',
      },
    });
  });

  it('follows resolvers for mutations', () => {
    jest.useFakeTimers();

    const mutation = gql`
      mutation {
        concealAuthor {
          id
          name
          __typename
        }
      }
    `;

    const mutationData = {
      __typename: 'Mutation',
      concealAuthor: {
        __typename: 'Author',
        id: '123',
        name: '[REDACTED ONLINE]',
      },
    };

    const client = createClient({ url: 'http://0.0.0.0' });
    const { source: ops$, next } = makeSubject<Operation>();

    const opOne = client.createRequestOperation('query', {
      key: 1,
      query: queryOne,
    });

    const opMutation = client.createRequestOperation('mutation', {
      key: 2,
      query: mutation,
    });

    const response = jest.fn(
      (forwardOp: Operation): OperationResult => {
        if (forwardOp.key === 1) {
          return { operation: opOne, data: queryOneData };
        } else if (forwardOp.key === 2) {
          return { operation: opMutation, data: mutationData };
        }

        return undefined as any;
      }
    );

    const result = jest.fn();
    const forward: ExchangeIO = ops$ => pipe(ops$, delay(1), map(response));

    const fakeResolver = jest.fn();

    pipe(
      cacheExchange({
        resolvers: {
          Author: {
            name: () => {
              fakeResolver();
              return 'newName';
            },
          },
        },
      })({ forward, client, dispatchDebug })(ops$),
      tap(result),
      publish
    );

    next(opOne);
    jest.runAllTimers();
    expect(response).toHaveBeenCalledTimes(1);

    next(opMutation);
    expect(response).toHaveBeenCalledTimes(1);
    expect(fakeResolver).toHaveBeenCalledTimes(1);

    jest.runAllTimers();
    expect(result.mock.calls[1][0].data).toEqual({
      __typename: 'Mutation',
      concealAuthor: {
        __typename: 'Author',
        id: '123',
        name: 'newName',
      },
    });
  });

  it('follows nested resolvers for mutations', () => {
    jest.useFakeTimers();

    const mutation = gql`
      mutation {
        concealAuthors {
          id
          name
          book {
            id
            title
            __typename
          }
          __typename
        }
      }
    `;

    const client = createClient({ url: 'http://0.0.0.0' });
    const { source: ops$, next } = makeSubject<Operation>();

    const query = gql`
      query {
        authors {
          id
          name
          book {
            id
            title
            __typename
          }
          __typename
        }
      }
    `;

    const queryOperation = client.createRequestOperation('query', {
      key: 1,
      query,
    });

    const mutationOperation = client.createRequestOperation('mutation', {
      key: 2,
      query: mutation,
    });

    const mutationData = {
      __typename: 'Mutation',
      concealAuthors: [
        {
          __typename: 'Author',
          id: '123',
          book: null,
          name: '[REDACTED ONLINE]',
        },
        {
          __typename: 'Author',
          id: '456',
          name: 'Formidable',
          book: {
            id: '1',
            title: 'AwesomeGQL',
            __typename: 'Book',
          },
        },
      ],
    };

    const queryData = {
      __typename: 'Query',
      authors: [
        {
          __typename: 'Author',
          id: '123',
          name: '[REDACTED ONLINE]',
          book: null,
        },
        {
          __typename: 'Author',
          id: '456',
          name: 'Formidable',
          book: {
            id: '1',
            title: 'AwesomeGQL',
            __typename: 'Book',
          },
        },
      ],
    };

    const response = jest.fn(
      (forwardOp: Operation): OperationResult => {
        if (forwardOp.key === 1) {
          return { operation: queryOperation, data: queryData };
        } else if (forwardOp.key === 2) {
          return { operation: mutationOperation, data: mutationData };
        }

        return undefined as any;
      }
    );

    const result = jest.fn();
    const forward: ExchangeIO = ops$ => pipe(ops$, delay(1), map(response));

    const fakeResolver = jest.fn();
    const called: any[] = [];

    pipe(
      cacheExchange({
        resolvers: {
          Query: {
            // TS-check
            author: (_parent, args) => ({ __typename: 'Author', id: args.id }),
          },
          Author: {
            name: parent => {
              called.push(parent.name);
              fakeResolver();
              return 'Secret Author';
            },
          },
          Book: {
            title: parent => {
              called.push(parent.title);
              fakeResolver();
              return 'Secret Book';
            },
          },
        },
      })({ forward, client, dispatchDebug })(ops$),
      tap(result),
      publish
    );

    next(queryOperation);
    jest.runAllTimers();
    expect(response).toHaveBeenCalledTimes(1);
    expect(fakeResolver).toHaveBeenCalledTimes(3);

    next(mutationOperation);
    jest.runAllTimers();
    expect(response).toHaveBeenCalledTimes(2);
    expect(fakeResolver).toHaveBeenCalledTimes(6);
    expect(result.mock.calls[1][0].data).toEqual({
      __typename: 'Mutation',
      concealAuthors: [
        {
          __typename: 'Author',
          id: '123',
          book: null,
          name: 'Secret Author',
        },
        {
          __typename: 'Author',
          id: '456',
          name: 'Secret Author',
          book: {
            id: '1',
            title: 'Secret Book',
            __typename: 'Book',
          },
        },
      ],
    });

    expect(called).toEqual([
      // Query
      '[REDACTED ONLINE]',
      'Formidable',
      'AwesomeGQL',
      // Mutation
      '[REDACTED ONLINE]',
      'Formidable',
      'AwesomeGQL',
    ]);
  });
});

describe('schema awareness', () => {
  it('reexecutes query and returns data on partial result', () => {
    jest.useFakeTimers();
    const client = createClient({ url: 'http://0.0.0.0' });
    const { source: ops$, next } = makeSubject<Operation>();
    const reexec = jest
      .spyOn(client, 'reexecuteOperation')
      // Empty mock to avoid going in an endless loop, since we would again return
      // partial data.
      .mockImplementation(() => undefined);

    const initialQuery = gql`
      query {
        todos {
          id
          text
          __typename
        }
      }
    `;

    const query = gql`
      query {
        todos {
          id
          text
          complete
          author {
            id
            name
            __typename
          }
          __typename
        }
      }
    `;

    const initialQueryOperation = client.createRequestOperation('query', {
      key: 1,
      query: initialQuery,
    });

    const queryOperation = client.createRequestOperation('query', {
      key: 2,
      query,
    });

    const queryData = {
      __typename: 'Query',
      todos: [
        {
          __typename: 'Todo',
          id: '123',
          text: 'Learn',
        },
        {
          __typename: 'Todo',
          id: '456',
          text: 'Teach',
        },
      ],
    };

    const response = jest.fn(
      (forwardOp: Operation): OperationResult => {
        if (forwardOp.key === 1) {
          return { operation: initialQueryOperation, data: queryData };
        } else if (forwardOp.key === 2) {
          return { operation: queryOperation, data: queryData };
        }

        return undefined as any;
      }
    );

    const result = jest.fn();
    const forward: ExchangeIO = ops$ => pipe(ops$, delay(1), map(response));

    pipe(
      cacheExchange({
        schema: minifyIntrospectionQuery(
          // eslint-disable-next-line
          require('./test-utils/simple_schema.json')
        ),
      })({ forward, client, dispatchDebug })(ops$),
      tap(result),
      publish
    );

    next(initialQueryOperation);
    jest.runAllTimers();
    expect(response).toHaveBeenCalledTimes(1);
    expect(reexec).toHaveBeenCalledTimes(0);
    expect(result.mock.calls[0][0].data).toMatchObject({
      todos: [
        {
          __typename: 'Todo',
          id: '123',
          text: 'Learn',
        },
        {
          __typename: 'Todo',
          id: '456',
          text: 'Teach',
        },
      ],
    });

    expect(result.mock.calls[0][0]).toHaveProperty(
      'operation.context.meta',
      undefined
    );

    next(queryOperation);
    jest.runAllTimers();
    expect(result).toHaveBeenCalledTimes(2);
    expect(reexec).toHaveBeenCalledTimes(1);
    expect(result.mock.calls[1][0].stale).toBe(true);
    expect(result.mock.calls[1][0].data).toEqual({
      todos: [
        {
          __typename: 'Todo',
          author: null,
          complete: null,
          id: '123',
          text: 'Learn',
        },
        {
          __typename: 'Todo',
          author: null,
          complete: null,
          id: '456',
          text: 'Teach',
        },
      ],
    });

    expect(result.mock.calls[1][0]).toHaveProperty(
      'operation.context.meta.cacheOutcome',
      'partial'
    );
  });

  it('reexecutes query and returns data on partial results for nullable lists', () => {
    jest.useFakeTimers();
    const client = createClient({ url: 'http://0.0.0.0' });
    const { source: ops$, next } = makeSubject<Operation>();
    const reexec = jest
      .spyOn(client, 'reexecuteOperation')
      // Empty mock to avoid going in an endless loop, since we would again return
      // partial data.
      .mockImplementation(() => undefined);

    const initialQuery = gql`
      query {
        todos {
          id
          __typename
        }
      }
    `;

    const query = gql`
      query {
        todos {
          id
          text
          __typename
        }
      }
    `;

    const initialQueryOperation = client.createRequestOperation('query', {
      key: 1,
      query: initialQuery,
    });

    const queryOperation = client.createRequestOperation('query', {
      key: 2,
      query,
    });

    const queryData = {
      __typename: 'Query',
      todos: [
        {
          __typename: 'Todo',
          id: '123',
        },
        {
          __typename: 'Todo',
          id: '456',
        },
      ],
    };

    const response = jest.fn(
      (forwardOp: Operation): OperationResult => {
        if (forwardOp.key === 1) {
          return { operation: initialQueryOperation, data: queryData };
        } else if (forwardOp.key === 2) {
          return { operation: queryOperation, data: queryData };
        }

        return undefined as any;
      }
    );

    const result = jest.fn();
    const forward: ExchangeIO = ops$ => pipe(ops$, delay(1), map(response));

    pipe(
      cacheExchange({
        schema: minifyIntrospectionQuery(
          // eslint-disable-next-line
          require('./test-utils/simple_schema.json')
        ),
      })({ forward, client, dispatchDebug })(ops$),
      tap(result),
      publish
    );

    next(initialQueryOperation);
    jest.runAllTimers();
    expect(response).toHaveBeenCalledTimes(1);
    expect(reexec).toHaveBeenCalledTimes(0);
    expect(result.mock.calls[0][0].data).toMatchObject({
      todos: [
        {
          __typename: 'Todo',
          id: '123',
        },
        {
          __typename: 'Todo',
          id: '456',
        },
      ],
    });

    expect(result.mock.calls[0][0]).toHaveProperty(
      'operation.context.meta',
      undefined
    );

    next(queryOperation);
    jest.runAllTimers();
    expect(result).toHaveBeenCalledTimes(2);
    expect(reexec).toHaveBeenCalledTimes(1);
    expect(result.mock.calls[1][0].stale).toBe(true);
    expect(result.mock.calls[1][0].data).toEqual({
      todos: [null, null],
    });

    expect(result.mock.calls[1][0]).toHaveProperty(
      'operation.context.meta.cacheOutcome',
      'partial'
    );
  });
});

describe('commutativity', () => {
  it('applies results that come in out-of-order commutatively and consistently', () => {
    jest.useFakeTimers();

    let data: any;

    const client = createClient({
      url: 'http://0.0.0.0',
      requestPolicy: 'cache-and-network',
    });
    const { source: ops$, next: next } = makeSubject<Operation>();
    const query = gql`
      {
        index
      }
    `;

    const result = (operation: Operation): Source<OperationResult> =>
      pipe(
        fromValue({
          operation,
          data: {
            __typename: 'Query',
            index: operation.key,
          },
        }),
        delay(operation.key === 2 ? 5 : operation.key * 10)
      );

    const output = jest.fn(result => {
      data = result.data;
    });

    const forward = (ops$: Source<Operation>): Source<OperationResult> =>
      pipe(
        ops$,
        filter(op => op.kind !== 'teardown'),
        mergeMap(result)
      );

    pipe(
      cacheExchange()({ forward, client, dispatchDebug })(ops$),
      tap(output),
      publish
    );

    next(client.createRequestOperation('query', { key: 1, query }));
    next(client.createRequestOperation('query', { key: 2, query }));

    // This shouldn't have any effect:
    next(client.createRequestOperation('teardown', { key: 2, query }));

    next(client.createRequestOperation('query', { key: 3, query }));

    jest.advanceTimersByTime(5);
    expect(output).toHaveBeenCalledTimes(1);
    expect(data.index).toBe(2);

    jest.advanceTimersByTime(10);
    expect(output).toHaveBeenCalledTimes(2);
    expect(data.index).toBe(2);

    jest.advanceTimersByTime(30);
    expect(output).toHaveBeenCalledTimes(3);
    expect(data.index).toBe(3);
  });

  it('applies optimistic updates on top of commutative queries as query result comes in', () => {
    let data: any;
    const client = createClient({ url: 'http://0.0.0.0' });
    const { source: ops$, next: nextOp } = makeSubject<Operation>();
    const { source: res$, next: nextRes } = makeSubject<OperationResult>();

    const reexec = jest
      .spyOn(client, 'reexecuteOperation')
      .mockImplementation(nextOp);

    const query = gql`
      {
        node {
          id
          name
        }
      }
    `;

    const mutation = gql`
      mutation {
        node {
          id
          name
        }
      }
    `;

    const forward = (ops$: Source<Operation>): Source<OperationResult> =>
      merge([
        pipe(
          ops$,
          filter(() => false)
        ) as any,
        res$,
      ]);

    const optimistic = {
      node: () => ({
        __typename: 'Node',
        id: 'node',
        name: 'optimistic',
      }),
    };

    pipe(
      cacheExchange({ optimistic })({ forward, client, dispatchDebug })(ops$),
      tap(result => {
        if (result.operation.kind === 'query') {
          data = result.data;
        }
      }),
      publish
    );

    const queryOpA = client.createRequestOperation('query', { key: 1, query });
    const mutationOp = client.createRequestOperation('mutation', {
      key: 2,
      query: mutation,
    });
    const queryOpB = client.createRequestOperation('query', { key: 3, query });

    expect(data).toBe(undefined);

    nextOp(queryOpA);

    nextRes({
      operation: queryOpA,
      data: {
        __typename: 'Query',
        node: {
          __typename: 'Node',
          id: 'node',
          name: 'query a',
        },
      },
    });

    expect(data).toHaveProperty('node.name', 'query a');

    nextOp(mutationOp);
    expect(reexec).toHaveBeenCalledTimes(1);
    expect(data).toHaveProperty('node.name', 'optimistic');

    // NOTE: We purposefully skip the following:
    // nextOp(queryOpB);

    nextRes({
      operation: queryOpB,
      data: {
        __typename: 'Query',
        node: {
          __typename: 'Node',
          id: 'node',
          name: 'query b',
        },
      },
    });

    expect(data).toHaveProperty('node.name', 'query b');
  });

  it('applies mutation results on top of commutative queries', () => {
    let data: any;
    const client = createClient({ url: 'http://0.0.0.0' });
    const { source: ops$, next: nextOp } = makeSubject<Operation>();
    const { source: res$, next: nextRes } = makeSubject<OperationResult>();

    const reexec = jest
      .spyOn(client, 'reexecuteOperation')
      .mockImplementation(nextOp);

    const query = gql`
      {
        node {
          id
          name
        }
      }
    `;

    const mutation = gql`
      mutation {
        node {
          id
          name
        }
      }
    `;

    const forward = (ops$: Source<Operation>): Source<OperationResult> =>
      merge([
        pipe(
          ops$,
          filter(() => false)
        ) as any,
        res$,
      ]);

    pipe(
      cacheExchange()({ forward, client, dispatchDebug })(ops$),
      tap(result => {
        if (result.operation.kind === 'query') {
          data = result.data;
        }
      }),
      publish
    );

    const queryOpA = client.createRequestOperation('query', { key: 1, query });
    const mutationOp = client.createRequestOperation('mutation', {
      key: 2,
      query: mutation,
    });
    const queryOpB = client.createRequestOperation('query', { key: 3, query });

    expect(data).toBe(undefined);

    nextOp(queryOpA);
    nextOp(mutationOp);
    nextOp(queryOpB);

    nextRes({
      operation: queryOpA,
      data: {
        __typename: 'Query',
        node: {
          __typename: 'Node',
          id: 'node',
          name: 'query a',
        },
      },
    });

    expect(data).toHaveProperty('node.name', 'query a');

    nextRes({
      operation: mutationOp,
      data: {
        __typename: 'Mutation',
        node: {
          __typename: 'Node',
          id: 'node',
          name: 'mutation',
        },
      },
    });

    expect(reexec).toHaveBeenCalledTimes(3);
    expect(data).toHaveProperty('node.name', 'mutation');

    nextRes({
      operation: queryOpB,
      data: {
        __typename: 'Query',
        node: {
          __typename: 'Node',
          id: 'node',
          name: 'query b',
        },
      },
    });

    expect(reexec).toHaveBeenCalledTimes(4);
    expect(data).toHaveProperty('node.name', 'mutation');
  });

  it('applies optimistic updates on top of commutative queries until mutation resolves', () => {
    let data: any;
    const client = createClient({ url: 'http://0.0.0.0' });
    const { source: ops$, next: nextOp } = makeSubject<Operation>();
    const { source: res$, next: nextRes } = makeSubject<OperationResult>();

    jest.spyOn(client, 'reexecuteOperation').mockImplementation(nextOp);

    const query = gql`
      {
        node {
          id
          name
        }
      }
    `;

    const mutation = gql`
      mutation {
        node {
          id
          name
          optimistic
        }
      }
    `;

    const forward = (ops$: Source<Operation>): Source<OperationResult> =>
      merge([
        pipe(
          ops$,
          filter(() => false)
        ) as any,
        res$,
      ]);

    const optimistic = {
      node: () => ({
        __typename: 'Node',
        id: 'node',
        name: 'optimistic',
      }),
    };

    pipe(
      cacheExchange({ optimistic })({ forward, client, dispatchDebug })(ops$),
      tap(result => {
        if (result.operation.kind === 'query') {
          data = result.data;
        }
      }),
      publish
    );

    const queryOp = client.createRequestOperation('query', { key: 1, query });
    const mutationOp = client.createRequestOperation('mutation', {
      key: 2,
      query: mutation,
    });

    expect(data).toBe(undefined);

    nextOp(queryOp);
    nextOp(mutationOp);

    nextRes({
      operation: queryOp,
      data: {
        __typename: 'Query',
        node: {
          __typename: 'Node',
          id: 'node',
          name: 'query a',
        },
      },
    });

    expect(data).toHaveProperty('node.name', 'optimistic');

    nextRes({
      operation: mutationOp,
      data: {
        __typename: 'Query',
        node: {
          __typename: 'Node',
          id: 'node',
          name: 'mutation',
        },
      },
    });

    expect(data).toHaveProperty('node.name', 'mutation');
  });

  it('allows subscription results to be commutative when necessary', () => {
    let data: any;
    const client = createClient({ url: 'http://0.0.0.0' });
    const { source: ops$, next: nextOp } = makeSubject<Operation>();
    const { source: res$, next: nextRes } = makeSubject<OperationResult>();

    jest.spyOn(client, 'reexecuteOperation').mockImplementation(nextOp);

    const query = gql`
      {
        node {
          id
          name
        }
      }
    `;

    const subscription = gql`
      subscription {
        node {
          id
          name
        }
      }
    `;

    const forward = (ops$: Source<Operation>): Source<OperationResult> =>
      merge([
        pipe(
          ops$,
          filter(() => false)
        ) as any,
        res$,
      ]);

    pipe(
      cacheExchange()({ forward, client, dispatchDebug })(ops$),
      tap(result => {
        if (result.operation.kind === 'query') {
          data = result.data;
        }
      }),
      publish
    );

    const queryOpA = client.createRequestOperation('query', { key: 1, query });
    const subscriptionOp = client.createRequestOperation('subscription', {
      key: 3,
      query: subscription,
    });

    nextOp(queryOpA);
    // Force commutative layers to be created:
    nextOp(client.createRequestOperation('query', { key: 2, query }));
    nextOp(subscriptionOp);

    nextRes({
      operation: queryOpA,
      data: {
        __typename: 'Query',
        node: {
          __typename: 'Node',
          id: 'node',
          name: 'query a',
        },
      },
    });

    nextRes({
      operation: subscriptionOp,
      data: {
        node: {
          __typename: 'Node',
          id: 'node',
          name: 'subscription',
        },
      },
    });

    expect(data).toHaveProperty('node.name', 'subscription');
  });

  it('allows subscription results to be commutative above mutations', () => {
    let data: any;
    const client = createClient({ url: 'http://0.0.0.0' });
    const { source: ops$, next: nextOp } = makeSubject<Operation>();
    const { source: res$, next: nextRes } = makeSubject<OperationResult>();

    jest.spyOn(client, 'reexecuteOperation').mockImplementation(nextOp);

    const query = gql`
      {
        node {
          id
          name
        }
      }
    `;

    const subscription = gql`
      subscription {
        node {
          id
          name
        }
      }
    `;

    const mutation = gql`
      mutation {
        node {
          id
          name
        }
      }
    `;

    const forward = (ops$: Source<Operation>): Source<OperationResult> =>
      merge([
        pipe(
          ops$,
          filter(() => false)
        ) as any,
        res$,
      ]);

    pipe(
      cacheExchange()({ forward, client, dispatchDebug })(ops$),
      tap(result => {
        if (result.operation.kind === 'query') {
          data = result.data;
        }
      }),
      publish
    );

    const queryOpA = client.createRequestOperation('query', { key: 1, query });

    const subscriptionOp = client.createRequestOperation('subscription', {
      key: 2,
      query: subscription,
    });

    const mutationOp = client.createRequestOperation('mutation', {
      key: 3,
      query: mutation,
    });

    nextOp(queryOpA);
    // Force commutative layers to be created:
    nextOp(client.createRequestOperation('query', { key: 2, query }));
    nextOp(subscriptionOp);

    nextRes({
      operation: queryOpA,
      data: {
        __typename: 'Query',
        node: {
          __typename: 'Node',
          id: 'node',
          name: 'query a',
        },
      },
    });

    nextOp(mutationOp);

    nextRes({
      operation: mutationOp,
      data: {
        node: {
          __typename: 'Node',
          id: 'node',
          name: 'mutation',
        },
      },
    });

    nextRes({
      operation: subscriptionOp,
      data: {
        node: {
          __typename: 'Node',
          id: 'node',
          name: 'subscription a',
        },
      },
    });

    nextRes({
      operation: subscriptionOp,
      data: {
        node: {
          __typename: 'Node',
          id: 'node',
          name: 'subscription b',
        },
      },
    });

    expect(data).toHaveProperty('node.name', 'subscription b');
  });

  it('applies deferred results to previous layers', () => {
    let normalData: any;
    let deferredData: any;
    let combinedData: any;

    const client = createClient({ url: 'http://0.0.0.0' });
    const { source: ops$, next: nextOp } = makeSubject<Operation>();
    const { source: res$, next: nextRes } = makeSubject<OperationResult>();

    jest.spyOn(client, 'reexecuteOperation').mockImplementation(nextOp);

    const normalQuery = gql`
      {
        node {
          id
          name
        }
      }
    `;

    const deferredQuery = gql`
      {
        ... @defer {
          deferred {
            id
            name
          }
        }
      }
    `;

    const combinedQuery = gql`
      {
        node {
          id
          name
        }
        ... @defer {
          deferred {
            id
            name
          }
        }
      }
    `;

    const forward = (ops$: Source<Operation>): Source<OperationResult> =>
      merge([
        pipe(
          ops$,
          filter(() => false)
        ) as any,
        res$,
      ]);

    pipe(
      cacheExchange()({ forward, client, dispatchDebug })(ops$),
      tap(result => {
        if (result.operation.kind === 'query') {
          if (result.operation.key === 1) {
            deferredData = result.data;
          } else if (result.operation.key === 42) {
            combinedData = result.data;
          } else {
            normalData = result.data;
          }
        }
      }),
      publish
    );

    const combinedOp = client.createRequestOperation('query', {
      key: 42,
      query: combinedQuery,
    });
    const deferredOp = client.createRequestOperation('query', {
      key: 1,
      query: deferredQuery,
    });
    const normalOp = client.createRequestOperation('query', {
      key: 2,
      query: normalQuery,
    });

    nextOp(combinedOp);
    nextOp(deferredOp);
    nextOp(normalOp);

    nextRes({
      operation: deferredOp,
      data: {
        __typename: 'Query',
      },
      hasNext: true,
    });

    expect(deferredData).toHaveProperty('deferred', undefined);

    nextRes({
      operation: normalOp,
      data: {
        __typename: 'Query',
        node: {
          __typename: 'Node',
          id: 2,
          name: 'normal',
        },
      },
    });

    expect(normalData).toHaveProperty('node.id', 2);
    expect(combinedData).toHaveProperty('deferred', undefined);
    expect(combinedData).toHaveProperty('node.id', 2);

    nextRes({
      operation: deferredOp,
      data: {
        __typename: 'Query',
        deferred: {
          __typename: 'Node',
          id: 1,
          name: 'deferred',
        },
      },
      hasNext: true,
    });

    expect(deferredData).toHaveProperty('deferred.id', 1);
    expect(combinedData).toHaveProperty('deferred.id', 1);
    expect(combinedData).toHaveProperty('node.id', 2);
  });
});

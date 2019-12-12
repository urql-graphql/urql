import gql from 'graphql-tag';
import {
  createClient,
  ExchangeIO,
  Operation,
  OperationResult,
} from 'urql/core';
import { pipe, map, makeSubject, tap, publish, delay } from 'wonka';
import { cacheExchange } from './cacheExchange';

const queryOne = gql`
  {
    author {
      id
      name
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
};

it('writes queries to the cache', () => {
  const client = createClient({ url: '' });
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

  const [ops$, next] = makeSubject<Operation>();
  const result = jest.fn();
  const forward: ExchangeIO = ops$ => pipe(ops$, map(response));

  pipe(cacheExchange({})({ forward, client })(ops$), tap(result), publish);

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
        name: 'Author',
      },
    ],
  };

  const client = createClient({ url: '' });
  const [ops$, next] = makeSubject<Operation>();

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

  pipe(cacheExchange({})({ forward, client })(ops$), tap(result), publish);

  next(opOne);
  expect(response).toHaveBeenCalledTimes(1);
  expect(result).toHaveBeenCalledTimes(1);

  next(opMultiple);
  expect(response).toHaveBeenCalledTimes(2);
  expect(reexec).toHaveBeenCalledWith(opOne);
  expect(result).toHaveBeenCalledTimes(3);
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

  const client = createClient({ url: '' });
  const [ops$, next] = makeSubject<Operation>();
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

  pipe(cacheExchange({})({ forward, client })(ops$), tap(result), publish);

  next(opOne);
  expect(response).toHaveBeenCalledTimes(1);

  next(opUnrelated);
  expect(response).toHaveBeenCalledTimes(2);

  expect(reexec).not.toHaveBeenCalled();
  expect(result).toHaveBeenCalledTimes(2);
});

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

  const client = createClient({ url: '' });
  const [ops$, next] = makeSubject<Operation>();

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
    cacheExchange({ optimistic })({ forward, client })(ops$),
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

it('follows resolvers on initial write', () => {
  const client = createClient({ url: '' });
  const [ops$, next] = makeSubject<Operation>();

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
    })({ forward, client })(ops$),
    tap(result),
    publish
  );

  next(opOne);
  expect(response).toHaveBeenCalledTimes(1);
  expect(fakeResolver).toHaveBeenCalledTimes(1);
  expect(result).toHaveBeenCalledTimes(1);
  expect(result.mock.calls[0][0].data).toEqual({
    __typename: 'Query',
    author: {
      __typename: 'Author',
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

  const client = createClient({ url: '' });
  const [ops$, next] = makeSubject<Operation>();

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
    })({ forward, client })(ops$),
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

  const client = createClient({ url: '' });
  const [ops$, next] = makeSubject<Operation>();

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
    })({ forward, client })(ops$),
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

it('reexecutes query and returns data on partial result', () => {
  jest.useFakeTimers();
  const client = createClient({ url: '' });
  const [ops$, next] = makeSubject<Operation>();
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
      // eslint-disable-next-line
      schema: require('./test-utils/simple_schema.json'),
    })({ forward, client })(ops$),
    tap(result),
    publish
  );

  next(initialQueryOperation);
  jest.runAllTimers();
  expect(response).toHaveBeenCalledTimes(1);
  expect(reexec).toHaveBeenCalledTimes(0);
  expect(result.mock.calls[0][0].data).toEqual({
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
    __typename: 'Query',
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

import { print } from 'graphql';

/** NOTE: Testing in this file is designed to test both the client and its interaction with default Exchanges */

import {
  Source,
  delay,
  map,
  pipe,
  subscribe,
  filter,
  toArray,
  tap,
  take,
} from 'wonka';

import { gql } from './gql';
import { Exchange, Operation, OperationResult } from './types';
import { makeOperation } from './utils';
import { createClient } from './client';
import { queryOperation, subscriptionOperation } from './test-utils';

const url = 'https://hostname.com';

describe('createClient', () => {
  it('passes snapshot', () => {
    const c = createClient({
      url,
    });

    expect(c).toMatchSnapshot();
  });
});

const query = {
  key: 1,
  query: gql`
    {
      todos {
        id
      }
    }
  `,
  variables: { example: 1234 },
};

let receivedOps: Operation[] = [];
let client = createClient({ url: '1234' });
const receiveMock = jest.fn((s: Source<Operation>) =>
  pipe(
    s,
    tap(op => (receivedOps = [...receivedOps, op])),
    map(op => ({ operation: op }))
  )
);
const exchangeMock = jest.fn(() => receiveMock);

beforeEach(() => {
  receivedOps = [];
  exchangeMock.mockClear();
  receiveMock.mockClear();
  client = createClient({
    url,
    exchanges: [exchangeMock] as any[],
    requestPolicy: 'cache-and-network',
  });
});

describe('exchange args', () => {
  it('receives forward function', () => {
    // @ts-ignore
    expect(typeof exchangeMock.mock.calls[0][0].forward).toBe('function');
  });

  it('receives client', () => {
    // @ts-ignore
    expect(exchangeMock.mock.calls[0][0]).toHaveProperty('client', client);
  });
});

describe('promisified methods', () => {
  it('query', () => {
    const queryResult = client
      .query(
        gql`
          {
            todos {
              id
            }
          }
        `,
        { example: 1234 },
        { requestPolicy: 'cache-only' }
      )
      .toPromise();

    const received = receivedOps[0];
    expect(print(received.query)).toEqual(print(query.query));
    expect(received.key).toBeDefined();
    expect(received.variables).toEqual({ example: 1234 });
    expect(received.kind).toEqual('query');
    expect(received.context).toEqual({
      url: 'https://hostname.com',
      requestPolicy: 'cache-only',
      fetchOptions: undefined,
      fetch: undefined,
      suspense: false,
      preferGetMethod: false,
    });
    expect(queryResult).toHaveProperty('then');
  });

  it('mutation', () => {
    const mutationResult = client
      .mutation(
        gql`
          {
            todos {
              id
            }
          }
        `,
        { example: 1234 }
      )
      .toPromise();

    const received = receivedOps[0];
    expect(print(received.query)).toEqual(print(query.query));
    expect(received.key).toBeDefined();
    expect(received.variables).toEqual({ example: 1234 });
    expect(received.kind).toEqual('mutation');
    expect(received.context).toEqual({
      url: 'https://hostname.com',
      requestPolicy: 'cache-and-network',
      fetchOptions: undefined,
      fetch: undefined,
      suspense: false,
      preferGetMethod: false,
    });
    expect(mutationResult).toHaveProperty('then');
  });
});

describe('synchronous methods', () => {
  it('readQuery', () => {
    const result = client.readQuery(
      gql`
        {
          todos {
            id
          }
        }
      `,
      { example: 1234 }
    );

    expect(receivedOps.length).toBe(2);
    expect(receivedOps[0].kind).toBe('query');
    expect(receivedOps[1].kind).toBe('teardown');
    expect(result).toEqual({
      operation: {
        ...query,
        context: expect.anything(),
        key: expect.any(Number),
        kind: 'query',
      },
    });
  });
});

describe('executeQuery', () => {
  it('passes query string exchange', () => {
    pipe(
      client.executeQuery(query),
      subscribe(x => x)
    );

    const receivedQuery = receivedOps[0].query;
    expect(print(receivedQuery)).toBe(print(query.query));
  });

  it('passes variables type to exchange', () => {
    pipe(
      client.executeQuery(query),
      subscribe(x => x)
    );

    expect(receivedOps[0]).toHaveProperty('variables', query.variables);
  });

  it('passes requestPolicy to exchange', () => {
    pipe(
      client.executeQuery(query),
      subscribe(x => x)
    );

    expect(receivedOps[0].context).toHaveProperty(
      'requestPolicy',
      'cache-and-network'
    );
  });

  it('allows overriding the requestPolicy', () => {
    pipe(
      client.executeQuery(query, { requestPolicy: 'cache-first' }),
      subscribe(x => x)
    );

    expect(receivedOps[0].context).toHaveProperty(
      'requestPolicy',
      'cache-first'
    );
  });

  it('passes kind type to exchange', () => {
    pipe(
      client.executeQuery(query),
      subscribe(x => x)
    );

    expect(receivedOps[0]).toHaveProperty('kind', 'query');
  });

  it('passes url (from context) to exchange', () => {
    pipe(
      client.executeQuery(query),
      subscribe(x => x)
    );

    expect(receivedOps[0]).toHaveProperty('context.url', url);
  });
});

describe('executeMutation', () => {
  it('passes query string exchange', async () => {
    pipe(
      client.executeMutation(query),
      subscribe(x => x)
    );

    const receivedQuery = receivedOps[0].query;
    expect(print(receivedQuery)).toBe(print(query.query));
  });

  it('passes variables type to exchange', () => {
    pipe(
      client.executeMutation(query),
      subscribe(x => x)
    );

    expect(receivedOps[0]).toHaveProperty('variables', query.variables);
  });

  it('passes kind type to exchange', () => {
    pipe(
      client.executeMutation(query),
      subscribe(x => x)
    );

    expect(receivedOps[0]).toHaveProperty('kind', 'mutation');
  });

  it('passes url (from context) to exchange', () => {
    pipe(
      client.executeMutation(query),
      subscribe(x => x)
    );

    expect(receivedOps[0]).toHaveProperty('context.url', url);
  });
});

describe('executeSubscription', () => {
  it('passes query string exchange', async () => {
    pipe(
      client.executeSubscription(query),
      subscribe(x => x)
    );

    const receivedQuery = receivedOps[0].query;
    expect(print(receivedQuery)).toBe(print(query.query));
  });

  it('passes variables type to exchange', () => {
    pipe(
      client.executeSubscription(query),
      subscribe(x => x)
    );

    expect(receivedOps[0]).toHaveProperty('variables', query.variables);
  });

  it('passes kind type to exchange', () => {
    pipe(
      client.executeSubscription(query),
      subscribe(x => x)
    );

    expect(receivedOps[0]).toHaveProperty('kind', 'subscription');
  });
});

describe('queuing behavior', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('queues reexecuteOperation, which dispatchOperation consumes', () => {
    const output: Array<Operation | OperationResult> = [];

    const exchange: Exchange = ({ client }) => ops$ => {
      return pipe(
        ops$,
        filter(op => op.kind !== 'teardown'),
        tap(op => {
          output.push(op);
          if (
            op.key === queryOperation.key &&
            op.context.requestPolicy === 'cache-first'
          ) {
            client.reexecuteOperation({
              ...op,
              context: {
                ...op.context,
                requestPolicy: 'network-only',
              },
            });
          }
        }),
        map(op => ({
          data: op.key,
          operation: op,
        }))
      );
    };

    const client = createClient({
      url: 'test',
      exchanges: [exchange],
    });

    pipe(
      client.results$,
      subscribe(result => {
        output.push(result);
      })
    );

    const results = pipe(
      client.executeRequestOperation(queryOperation),
      toArray
    );

    expect(output.length).toBe(4);
    expect(results.length).toBe(2);

    expect(output[0]).toHaveProperty('key', queryOperation.key);
    expect(output[0]).toHaveProperty('context.requestPolicy', 'cache-first');

    expect(output[1]).toHaveProperty('operation.key', queryOperation.key);
    expect(output[1]).toHaveProperty(
      'operation.context.requestPolicy',
      'cache-first'
    );

    expect(output[2]).toHaveProperty('key', queryOperation.key);
    expect(output[2]).toHaveProperty('context.requestPolicy', 'network-only');

    expect(output[3]).toHaveProperty('operation.key', queryOperation.key);
    expect(output[3]).toHaveProperty(
      'operation.context.requestPolicy',
      'network-only'
    );

    expect(output[1]).toBe(results[0]);
    expect(output[3]).toBe(results[1]);
  });

  it('reemits previous results as stale if the operation is reexecuted as network-only', async () => {
    const output: OperationResult[] = [];

    const exchange: Exchange = () => {
      let countRes = 0;
      return ops$ => {
        return pipe(
          ops$,
          filter(op => op.kind !== 'teardown'),
          map(op => ({
            data: ++countRes,
            operation: op,
          })),
          delay(1)
        );
      };
    };

    const client = createClient({
      url: 'test',
      exchanges: [exchange],
    });

    const { unsubscribe } = pipe(
      client.executeRequestOperation(queryOperation),
      subscribe(result => {
        output.push(result);
      })
    );

    jest.advanceTimersByTime(1);

    expect(output.length).toBe(1);
    expect(output[0]).toHaveProperty('data', 1);
    expect(output[0]).toHaveProperty('operation.key', queryOperation.key);
    expect(output[0]).toHaveProperty(
      'operation.context.requestPolicy',
      'cache-first'
    );

    client.reexecuteOperation(
      makeOperation(queryOperation.kind, queryOperation, {
        ...queryOperation.context,
        requestPolicy: 'network-only',
      })
    );

    await Promise.resolve();

    expect(output.length).toBe(2);
    expect(output[1]).toHaveProperty('data', 1);
    expect(output[1]).toHaveProperty('stale', true);
    expect(output[1]).toHaveProperty('operation.key', queryOperation.key);
    expect(output[1]).toHaveProperty(
      'operation.context.requestPolicy',
      'cache-first'
    );

    jest.advanceTimersByTime(1);

    expect(output.length).toBe(3);
    expect(output[2]).toHaveProperty('data', 2);
    expect(output[2]).toHaveProperty('stale', undefined);
    expect(output[2]).toHaveProperty('operation.key', queryOperation.key);
    expect(output[2]).toHaveProperty(
      'operation.context.requestPolicy',
      'network-only'
    );

    unsubscribe();
  });

  it('does not reemit previous results as stale if it was marked as stale already', async () => {
    const output: OperationResult[] = [];
    const exchange: Exchange = () => ops$ => {
      return pipe(
        ops$,
        filter(op => op.kind !== 'teardown'),
        map(op => ({
          data: 1,
          operation: op,
          stale: true,
        })),
        delay(1)
      );
    };

    const client = createClient({
      url: 'test',
      exchanges: [exchange],
    });

    const { unsubscribe } = pipe(
      client.executeRequestOperation(queryOperation),
      subscribe(result => {
        output.push(result);
      })
    );

    jest.advanceTimersByTime(1);

    expect(output.length).toBe(1);
    expect(output[0]).toHaveProperty('operation.key', queryOperation.key);
    expect(output[0]).toHaveProperty(
      'operation.context.requestPolicy',
      'cache-first'
    );

    client.reexecuteOperation(
      makeOperation(queryOperation.kind, queryOperation, {
        ...queryOperation.context,
        requestPolicy: 'network-only',
      })
    );

    await Promise.resolve();
    jest.advanceTimersByTime(1);

    expect(output.length).toBe(2);
    expect(output[1]).toHaveProperty('stale', true);
    expect(output[1]).toHaveProperty('operation.key', queryOperation.key);
    expect(output[1]).toHaveProperty(
      'operation.context.requestPolicy',
      'network-only'
    );

    unsubscribe();
  });
});

describe('shared sources behavior', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('replays results from prior operation result as needed', async () => {
    const exchange: Exchange = () => ops$ => {
      let i = 0;
      return pipe(
        ops$,
        map(op => ({
          data: ++i,
          operation: op,
        })),
        delay(1)
      );
    };

    const client = createClient({
      url: 'test',
      exchanges: [exchange],
    });

    const resultOne = jest.fn();
    const resultTwo = jest.fn();

    pipe(client.executeRequestOperation(queryOperation), subscribe(resultOne));

    expect(resultOne).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(1);

    expect(resultOne).toHaveBeenCalledTimes(1);
    expect(resultOne).toHaveBeenCalledWith({
      data: 1,
      operation: queryOperation,
    });

    pipe(client.executeRequestOperation(queryOperation), subscribe(resultTwo));

    expect(resultTwo).toHaveBeenCalledWith({
      data: 1,
      stale: true,
      operation: queryOperation,
    });

    jest.advanceTimersByTime(1);

    expect(resultTwo).toHaveBeenCalledWith({
      data: 2,
      operation: queryOperation,
    });
  });

  it('replayed results are not emitted on the shared source', () => {
    const exchange: Exchange = () => ops$ => {
      let i = 0;
      return pipe(
        ops$,
        map(op => ({
          data: ++i,
          operation: op,
        })),
        take(1)
      );
    };

    const client = createClient({
      url: 'test',
      exchanges: [exchange],
    });

    const resultOne = jest.fn();
    const resultTwo = jest.fn();

    pipe(client.executeRequestOperation(queryOperation), subscribe(resultOne));

    pipe(client.executeRequestOperation(queryOperation), subscribe(resultTwo));

    expect(resultOne).toHaveBeenCalledTimes(1);
    expect(resultTwo).toHaveBeenCalledTimes(1);

    expect(resultTwo).toHaveBeenCalledWith({
      data: 1,
      operation: queryOperation,
      stale: true,
    });
  });

  it('does nothing when no operation result has been emitted yet', () => {
    const exchange: Exchange = () => ops$ => {
      return pipe(
        ops$,
        map(op => ({ data: 1, operation: op })),
        filter(() => false)
      );
    };

    const client = createClient({
      url: 'test',
      exchanges: [exchange],
    });

    const resultOne = jest.fn();
    const resultTwo = jest.fn();

    pipe(client.executeRequestOperation(queryOperation), subscribe(resultOne));

    pipe(client.executeRequestOperation(queryOperation), subscribe(resultTwo));

    expect(resultOne).toHaveBeenCalledTimes(0);
    expect(resultTwo).toHaveBeenCalledTimes(0);
  });

  it('skips replaying results when a result is emitted immediately', () => {
    const exchange: Exchange = () => ops$ => {
      let i = 0;
      return pipe(
        ops$,
        map(op => ({ data: ++i, operation: op }))
      );
    };

    const client = createClient({
      url: 'test',
      exchanges: [exchange],
    });

    const resultOne = jest.fn();
    const resultTwo = jest.fn();

    pipe(client.executeRequestOperation(queryOperation), subscribe(resultOne));

    expect(resultOne).toHaveBeenCalledWith({
      data: 1,
      operation: queryOperation,
    });

    pipe(client.executeRequestOperation(queryOperation), subscribe(resultTwo));

    expect(resultTwo).toHaveBeenCalledWith({
      data: 2,
      operation: queryOperation,
    });

    expect(resultOne).toHaveBeenCalledWith({
      data: 2,
      operation: queryOperation,
    });
  });

  it('replays stale results as needed', () => {
    const exchange: Exchange = () => ops$ => {
      return pipe(
        ops$,
        map(op => ({ stale: true, data: 1, operation: op })),
        take(1)
      );
    };

    const client = createClient({
      url: 'test',
      exchanges: [exchange],
    });

    const resultOne = jest.fn();
    const resultTwo = jest.fn();

    pipe(client.executeRequestOperation(queryOperation), subscribe(resultOne));

    expect(resultOne).toHaveBeenCalledWith({
      data: 1,
      operation: queryOperation,
      stale: true,
    });

    pipe(client.executeRequestOperation(queryOperation), subscribe(resultTwo));

    expect(resultTwo).toHaveBeenCalledWith({
      data: 1,
      operation: queryOperation,
      stale: true,
    });
  });

  it('does nothing when operation is a subscription has been emitted yet', () => {
    const exchange: Exchange = () => ops$ => {
      return pipe(
        ops$,
        map(op => ({ data: 1, operation: op })),
        take(1),
      );
    };

    const client = createClient({
      url: 'test',
      exchanges: [exchange],
    });

    const resultOne = jest.fn();
    const resultTwo = jest.fn();

    pipe(client.executeRequestOperation(subscriptionOperation), subscribe(resultOne));
    expect(resultOne).toHaveBeenCalledTimes(1);

    pipe(client.executeRequestOperation(subscriptionOperation), subscribe(resultTwo));
    expect(resultTwo).toHaveBeenCalledTimes(0);
  });


});

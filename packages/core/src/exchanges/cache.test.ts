import {
  empty,
  makeSubject,
  map,
  merge,
  mergeMap,
  pipe,
  publish,
  Source,
  Subject,
  subscribe,
  forEach,
  scan,
  toPromise,
} from 'wonka';
import { vi, expect, it, beforeEach, describe } from 'vitest';

import { Client, createClient } from '../client';
import { gql } from '../gql';
import { makeErrorResult } from '../utils';
import {
  mutationOperation,
  mutationResponse,
  queryOperation,
  queryResponse,
  subscriptionOperation,
  subscriptionResult,
  undefinedQueryResponse,
} from '../test-utils';
import { Exchange, Operation, OperationResult, ExchangeInput } from '../types';
import { cacheExchange } from './cache';

const reexecuteOperation = vi.fn();
const dispatchDebug = vi.fn();

let response;
let exchangeArgs: ExchangeInput;
let forwardedOperations: Operation[];
let input: Subject<Operation>;

beforeEach(() => {
  response = queryResponse;
  forwardedOperations = [];
  input = makeSubject<Operation>();

  // Collect all forwarded operations
  const forward = (s: Source<Operation>) => {
    return pipe(
      s,
      map(op => {
        forwardedOperations.push(op);
        return response;
      })
    );
  };

  const client = {
    reexecuteOperation: reexecuteOperation as any,
  } as Client;

  exchangeArgs = { forward, client, dispatchDebug };
});

describe('on query', () => {
  it('forwards to next exchange when no cache hit', () => {
    const { source: ops$, next, complete } = input;
    const exchange = cacheExchange(exchangeArgs)(ops$);

    publish(exchange);
    next(queryOperation);
    complete();
    expect(forwardedOperations.length).toBe(1);
    expect(reexecuteOperation).not.toBeCalled();
  });

  it('caches results', () => {
    const { source: ops$, next, complete } = input;
    const exchange = cacheExchange(exchangeArgs)(ops$);

    publish(exchange);
    next(queryOperation);
    next(queryOperation);
    complete();
    expect(forwardedOperations.length).toBe(1);
    expect(reexecuteOperation).not.toBeCalled();
  });

  it('respects cache-and-network', () => {
    const { source: ops$, next, complete } = input;
    const result = vi.fn();
    const exchange = cacheExchange(exchangeArgs)(ops$);

    pipe(exchange, forEach(result));
    next(queryOperation);

    next({
      ...queryOperation,
      context: {
        ...queryOperation.context,
        requestPolicy: 'cache-and-network',
      },
    });

    complete();
    expect(forwardedOperations.length).toBe(1);
    expect(reexecuteOperation).toHaveBeenCalledTimes(1);
    expect(result).toHaveBeenCalledTimes(2);
    expect(result.mock.calls[1][0].stale).toBe(true);

    expect(reexecuteOperation.mock.calls[0][0]).toEqual({
      ...queryOperation,
      context: { ...queryOperation.context, requestPolicy: 'network-only' },
    });
  });

  it('respects cache-only', () => {
    const { source: ops$, next, complete } = input;
    const exchange = cacheExchange(exchangeArgs)(ops$);

    publish(exchange);
    next({
      ...queryOperation,
      context: {
        ...queryOperation.context,
        requestPolicy: 'cache-only',
      },
    });
    complete();
    expect(forwardedOperations.length).toBe(0);
    expect(reexecuteOperation).not.toBeCalled();
  });

  describe('cache hit', () => {
    it('is miss when operation is forwarded', () => {
      const { source: ops$, next, complete } = input;
      const exchange = cacheExchange(exchangeArgs)(ops$);

      publish(exchange);
      next(queryOperation);
      complete();

      expect(forwardedOperations[0].context).toHaveProperty(
        'meta.cacheOutcome',
        'miss'
      );
    });

    it('is true when cached response is returned', async () => {
      const { source: ops$, next, complete } = input;
      const exchange = cacheExchange(exchangeArgs)(ops$);

      const results$ = pipe(
        exchange,
        scan((acc, x) => [...acc, x], [] as OperationResult[]),
        toPromise
      );

      publish(exchange);
      next(queryOperation);
      next(queryOperation);
      complete();

      const results = await results$;
      expect(results[1].operation.context).toHaveProperty(
        'meta.cacheOutcome',
        'hit'
      );
    });
  });
});

describe('on mutation', () => {
  it('does not cache', () => {
    response = mutationResponse;
    const { source: ops$, next, complete } = input;
    const exchange = cacheExchange(exchangeArgs)(ops$);

    publish(exchange);
    next(mutationOperation);
    next(mutationOperation);
    complete();
    expect(forwardedOperations.length).toBe(2);
    expect(reexecuteOperation).not.toBeCalled();
  });
});

describe('on subscription', () => {
  it('forwards subscriptions', () => {
    response = subscriptionResult;
    const { source: ops$, next, complete } = input;
    const exchange = cacheExchange(exchangeArgs)(ops$);

    publish(exchange);
    next(subscriptionOperation);
    next(subscriptionOperation);
    complete();
    expect(forwardedOperations.length).toBe(2);
    expect(reexecuteOperation).not.toBeCalled();
  });
});

// Empty query response implies the data propertys is undefined
describe('on empty query response', () => {
  beforeEach(() => {
    response = undefinedQueryResponse;
    forwardedOperations = [];
    input = makeSubject<Operation>();

    // Collect all forwarded operations
    const forward = (s: Source<Operation>) => {
      return pipe(
        s,
        map(op => {
          forwardedOperations.push(op);
          return response;
        })
      );
    };

    const client = {
      reexecuteOperation: reexecuteOperation as any,
    } as Client;

    exchangeArgs = { forward, client, dispatchDebug };
  });

  it('does not cache response', () => {
    const { source: ops$, next, complete } = input;
    const exchange = cacheExchange(exchangeArgs)(ops$);

    publish(exchange);
    next(queryOperation);
    next(queryOperation);
    complete();
    // 2 indicates it's not cached.
    expect(forwardedOperations.length).toBe(2);
    expect(reexecuteOperation).not.toBeCalled();
  });
});

describe('on invalidation while a query is in-flight', () => {
  const todosQuery = gql`
    {
      todos {
        id
        text
      }
    }
  `;

  const renameTodo = gql`
    mutation {
      renameTodo {
        id
        text
      }
    }
  `;

  const renameUser = gql`
    mutation {
      renameUser {
        id
      }
    }
  `;

  const todoUpdates = gql`
    subscription {
      todoUpdates {
        id
      }
    }
  `;

  const tick = async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  };

  const todos = (text: string) => ({
    todos: [{ __typename: 'Todo', id: '1', text }],
  });

  const renamedTodo = (text: string) => ({
    renameTodo: { __typename: 'Todo', id: '1', text },
  });

  // Sets up a real client over a network exchange that records requests, and only answers them
  // when a test does, so that the order of the answers is fixed, without timers
  const setup = () => {
    const sent: Operation[] = [];
    const results = makeSubject<OperationResult>();

    const network: Exchange = () => ops$ =>
      merge([
        pipe(
          ops$,
          mergeMap((op): Source<OperationResult> => {
            if (op.kind !== 'teardown') sent.push(op);
            return empty;
          })
        ),
        results.source,
      ]);

    const client = createClient({
      url: 'http://0.0.0.0',
      exchanges: [cacheExchange, network],
    });

    const answer = (operation: Operation, data: any, hasNext = false) =>
      results.next({ operation, data, hasNext, stale: false });

    const sentQueries = () => sent.filter(op => op.kind === 'query');

    const mutate = async (query: typeof renameTodo, data: any) => {
      const count = sent.length;
      const promise = client.mutation(query, {}).toPromise();
      answer(sent[count], data);
      await promise;
      await tick();
    };

    const observe = (context?: Parameters<typeof client.query>[2]) => {
      const seen: { text?: string; stale: boolean }[] = [];
      const subscription = pipe(
        client.query(todosQuery, {}, context),
        subscribe(result => {
          seen.push({
            text: result.data && result.data.todos[0].text,
            stale: result.stale,
          });
        })
      );
      return { seen, subscription };
    };

    return { client, results, sent, sentQueries, answer, mutate, observe };
  };

  it('refetches when the first request was in-flight', async () => {
    const { client, sentQueries, answer, mutate, observe } = setup();
    const { seen } = observe();

    await mutate(renameTodo, renamedTodo('new'));
    expect(sentQueries().length).toBe(1);

    answer(sentQueries()[0], todos('old'));
    expect(seen).toEqual([{ text: 'old', stale: true }]);

    await tick();
    expect(sentQueries().length).toBe(2);
    expect(sentQueries()[1].context.requestPolicy).toBe('network-only');

    answer(sentQueries()[1], todos('new'));
    expect(seen[seen.length - 1]).toEqual({ text: 'new', stale: false });

    await tick();
    expect(sentQueries().length).toBe(2);

    const later = await client.query(todosQuery, {}).toPromise();
    expect(later.data.todos[0].text).toBe('new');
    expect(later.operation.context.meta!.cacheOutcome).toBe('hit');
  });

  it('refetches when cache-and-network was in-flight', async () => {
    const { client, sentQueries, answer, mutate, observe } = setup();

    const first = client.query(todosQuery, {}).toPromise();
    answer(sentQueries()[0], todos('old'));
    await first;
    await tick();

    const { seen } = observe({ requestPolicy: 'cache-and-network' });
    await tick();
    expect(sentQueries().length).toBe(2);

    await mutate(renameTodo, renamedTodo('new'));
    expect(sentQueries().length).toBe(2);

    answer(sentQueries()[1], todos('old'));
    await tick();
    expect(sentQueries().length).toBe(3);

    answer(sentQueries()[2], todos('new'));
    expect(seen[seen.length - 1]).toEqual({ text: 'new', stale: false });
  });

  it('refetches when a second mutation lands during the refetch of the first', async () => {
    const { sentQueries, answer, mutate, observe } = setup();
    const { seen } = observe();

    answer(sentQueries()[0], todos('v1'));
    await tick();

    await mutate(renameTodo, renamedTodo('v2'));
    expect(sentQueries().length).toBe(2);

    await mutate(renameTodo, renamedTodo('v3'));
    expect(sentQueries().length).toBe(2);

    answer(sentQueries()[1], todos('v2'));
    expect(seen[seen.length - 1]).toEqual({ text: 'v2', stale: true });

    await tick();
    expect(sentQueries().length).toBe(3);

    answer(sentQueries()[2], todos('v3'));
    expect(seen[seen.length - 1]).toEqual({ text: 'v3', stale: false });
  });

  it('settles network-only promises merged into the same request on the refetch', async () => {
    const { client, sentQueries, answer, mutate } = setup();
    const context = { requestPolicy: 'network-only' as const };

    const before = client.query(todosQuery, {}, context).toPromise();
    await tick();
    await mutate(renameTodo, renamedTodo('new'));
    const after = client.query(todosQuery, {}, context).toPromise();
    await tick();

    // The client still sends one request at a time
    expect(sentQueries().length).toBe(1);

    answer(sentQueries()[0], todos('old'));
    await tick();
    expect(sentQueries().length).toBe(2);

    answer(sentQueries()[1], todos('new'));
    expect((await before).data.todos[0].text).toBe('new');
    expect((await after).data.todos[0].text).toBe('new');
  });

  it('ends on the newest data when two requests answer out of order', async () => {
    const { client, sentQueries, answer, mutate, observe } = setup();
    const { seen } = observe();

    answer(sentQueries()[0], todos('old'));
    await tick();

    // Once a query has a result, the client lets a further request through
    client.query(todosQuery, {}, { requestPolicy: 'network-only' }).toPromise();
    await tick();
    expect(sentQueries().length).toBe(2);

    await mutate(renameTodo, renamedTodo('new'));
    expect(sentQueries().length).toBe(3);

    answer(sentQueries()[2], todos('new'));
    answer(sentQueries()[1], todos('old'));
    await tick();
    expect(sentQueries().length).toBe(4);

    answer(sentQueries()[3], todos('new'));
    expect(seen[seen.length - 1]).toEqual({ text: 'new', stale: false });
  });

  it('ends on the newest data when an older request fails last', async () => {
    const { client, sentQueries, results, answer, mutate, observe } = setup();
    const { seen } = observe();

    answer(sentQueries()[0], todos('old'));
    await tick();

    client.query(todosQuery, {}, { requestPolicy: 'network-only' }).toPromise();
    await tick();
    await mutate(renameTodo, renamedTodo('new'));
    expect(sentQueries().length).toBe(3);

    answer(sentQueries()[2], todos('new'));
    results.next(makeErrorResult(sentQueries()[1], new Error('failed')));
    await tick();
    expect(sentQueries().length).toBe(4);

    answer(sentQueries()[3], todos('new'));
    expect(seen[seen.length - 1]).toEqual({ text: 'new', stale: false });
  });

  it('refetches when a subscription invalidates via additionalTypenames', async () => {
    const { client, results, sent, sentQueries, answer, observe } = setup();
    const { seen } = observe();

    pipe(
      client.subscription(todoUpdates, {}, { additionalTypenames: ['Todo'] }),
      subscribe(() => {
        /* noop */
      })
    );
    await tick();

    results.next({
      operation: sent.find(op => op.kind === 'subscription')!,
      data: { todoUpdates: { __typename: 'Other', id: '1' } },
      hasNext: true,
      stale: false,
    });

    answer(sentQueries()[0], todos('old'));
    expect(seen).toEqual([{ text: 'old', stale: true }]);

    await tick();
    expect(sentQueries().length).toBe(2);
  });

  it('only marks the last result of an incremental response', async () => {
    const { sentQueries, answer, mutate, observe } = setup();
    const { seen, subscription } = observe();

    await mutate(renameTodo, renamedTodo('new'));

    answer(sentQueries()[0], todos('old'), true);
    expect(seen[seen.length - 1]).toEqual({ text: 'old', stale: false });
    await tick();
    expect(sentQueries().length).toBe(1);

    answer(sentQueries()[0], todos('old'));
    expect(seen[seen.length - 1]).toEqual({ text: 'old', stale: true });
    await tick();
    expect(sentQueries().length).toBe(2);

    // The earlier incremental result isn't left behind in the cache
    subscription.unsubscribe();
    observe();
    await tick();
    expect(sentQueries().length).toBe(3);
  });

  it('keeps results when a mutation has no matching typename', async () => {
    const { sentQueries, answer, mutate, observe } = setup();
    const { seen } = observe();

    await mutate(renameUser, {
      renameUser: { __typename: 'User', id: '1' },
    });

    answer(sentQueries()[0], todos('current'));
    expect(seen).toEqual([{ text: 'current', stale: false }]);

    await tick();
    expect(sentQueries().length).toBe(1);
  });

  it('keeps results when the mutation failed', async () => {
    const { client, sent, sentQueries, answer, results, observe } = setup();
    const { seen } = observe();

    const mutation = client.mutation(renameTodo, {}).toPromise();
    results.next(makeErrorResult(sent[1], new Error('failed')));
    await mutation;
    await tick();

    answer(sentQueries()[0], todos('current'));
    expect(seen).toEqual([{ text: 'current', stale: false }]);

    await tick();
    expect(sentQueries().length).toBe(1);
  });

  it('does not refetch when the query fails, and starts over on the next request', async () => {
    const { client, sentQueries, results, answer, mutate } = setup();

    const seen: OperationResult[] = [];
    const { unsubscribe } = pipe(
      client.query(todosQuery, {}),
      subscribe(result => {
        seen.push(result);
      })
    );

    await mutate(renameTodo, renamedTodo('new'));

    results.next(makeErrorResult(sentQueries()[0], new Error('failed')));
    expect(seen.length).toBe(1);
    expect(seen[0].error).toBeDefined();
    expect(seen[0].stale).toBe(false);

    await tick();
    expect(sentQueries().length).toBe(1);
    unsubscribe();

    const next = client.query(todosQuery, {}).toPromise();
    await tick();
    expect(sentQueries().length).toBe(2);

    answer(sentQueries()[1], todos('new'));
    expect((await next).stale).toBe(false);
    await tick();
    expect(sentQueries().length).toBe(2);
  });

  it('forgets invalidations when the query is torn down', async () => {
    const { sentQueries, answer, mutate, observe } = setup();
    const { subscription } = observe();

    await mutate(renameTodo, renamedTodo('new'));
    subscription.unsubscribe();
    await tick();
    expect(sentQueries().length).toBe(1);

    const { seen } = observe();
    await tick();
    expect(sentQueries().length).toBe(2);

    answer(sentQueries()[1], todos('new'));
    expect(seen).toEqual([{ text: 'new', stale: false }]);

    await tick();
    expect(sentQueries().length).toBe(2);
  });

  it('does not refetch for a torn down query whose result still arrives', async () => {
    const { sentQueries, answer, mutate, observe } = setup();
    const { seen, subscription } = observe();

    await mutate(renameTodo, renamedTodo('new'));
    subscription.unsubscribe();
    await tick();

    answer(sentQueries()[0], todos('old'));
    await tick();
    expect(seen).toEqual([]);
    expect(sentQueries().length).toBe(1);
  });
});

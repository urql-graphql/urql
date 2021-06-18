import { makeSubject } from 'wonka';
import { createClient } from '@urql/core';
import { operationStore } from './operationStore';
import { query, subscription, mutation } from './operations';

const client = createClient({ url: '/graphql', exchanges: [] });

jest.mock('./context', () => ({ getClient: () => client }));
jest.mock('svelte', () => ({ onDestroy: () => undefined }));

beforeEach(() => {
  jest.resetAllMocks();
});

describe('query', () => {
  it('subscribes to a query and updates data', () => {
    const subscriber = jest.fn();
    const subject = makeSubject<any>();
    const executeQuery = jest
      .spyOn(client, 'executeQuery')
      .mockImplementation(() => subject.source);

    const store = operationStore('{ test }');
    store.subscribe(subscriber);

    query(store);

    expect(executeQuery).toHaveBeenCalledWith(
      {
        key: expect.any(Number),
        query: expect.any(Object),
        variables: {},
        context: undefined,
      },
      undefined
    );

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(store.fetching).toBe(true);

    subject.next({ data: { test: true } });
    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(store.data).toEqual({ test: true });

    subject.complete();
    expect(subscriber).toHaveBeenCalledTimes(4);
    expect(store.fetching).toBe(false);
  });

  it('pauses the query when requested to do so', () => {
    const subscriber = jest.fn();
    const subject = makeSubject<any>();
    const executeQuery = jest
      .spyOn(client, 'executeQuery')
      .mockImplementation(() => subject.source);

    const store = operationStore('{ test }', undefined, { pause: true });
    store.subscribe(subscriber);

    query(store);

    expect(executeQuery).not.toHaveBeenCalled();
    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(store.fetching).toBe(false);
    expect(store.stale).toBe(false);

    store.set({ context: { pause: false } });
    expect(executeQuery).toHaveBeenCalled();
    expect(subscriber).toHaveBeenCalledTimes(4);
    expect(store.fetching).toBe(true);
  });

  it('updates the executed query when inputs change', () => {
    const subscriber = jest.fn();
    const subject = makeSubject<any>();
    const executeQuery = jest
      .spyOn(client, 'executeQuery')
      .mockImplementation(() => subject.source);

    const store = operationStore('{ test }');
    store.subscribe(subscriber);

    query(store);

    expect(executeQuery).toHaveBeenCalledWith(
      {
        key: expect.any(Number),
        query: expect.any(Object),
        variables: {},
        context: undefined,
      },
      undefined
    );

    subject.next({ data: { test: true } });
    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(store.data).toEqual({ test: true });

    store.variables = { test: true };
    expect(executeQuery).toHaveBeenCalledTimes(2);
    expect(executeQuery).toHaveBeenCalledWith(
      {
        key: expect.any(Number),
        query: expect.any(Object),
        variables: { test: true },
        context: undefined,
      },
      undefined
    );

    expect(subscriber).toHaveBeenCalledTimes(5);
    expect(store.fetching).toBe(true);
    expect(store.data).toEqual({ test: true });

    store.context = { requestPolicy: 'cache-and-network' };
    expect(executeQuery).toHaveBeenCalledTimes(3);
    expect(executeQuery).toHaveBeenCalledWith(
      {
        key: expect.any(Number),
        query: expect.any(Object),
        variables: { test: true },
        context: { requestPolicy: 'cache-and-network' },
      },
      {
        requestPolicy: 'cache-and-network',
      }
    );
  });
});

describe('subscription', () => {
  it('subscribes to a subscription and updates data', () => {
    const subscriber = jest.fn();
    const subject = makeSubject<any>();
    const executeQuery = jest
      .spyOn(client, 'executeSubscription')
      .mockImplementation(() => subject.source);

    const store = operationStore('subscription { test }');
    store.subscribe(subscriber);

    subscription(store);

    expect(executeQuery).toHaveBeenCalledWith(
      {
        key: expect.any(Number),
        query: expect.any(Object),
        variables: {},
      },
      undefined
    );

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(store.fetching).toBe(true);

    subject.next({ data: { test: true } });
    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(store.data).toEqual({ test: true });

    subject.complete();
    expect(subscriber).toHaveBeenCalledTimes(4);
    expect(store.fetching).toBe(false);
  });

  it('updates the executed subscription when inputs change', () => {
    const subscriber = jest.fn();
    const subject = makeSubject<any>();
    const executeSubscription = jest
      .spyOn(client, 'executeSubscription')
      .mockImplementation(() => subject.source);

    const store = operationStore('{ test }');
    store.subscribe(subscriber);

    subscription(store);

    expect(executeSubscription).toHaveBeenCalledWith(
      {
        key: expect.any(Number),
        query: expect.any(Object),
        variables: {},
      },
      undefined
    );

    subject.next({ data: { test: true } });
    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(store.data).toEqual({ test: true });

    store.variables = { test: true };
    expect(executeSubscription).toHaveBeenCalledTimes(2);
    expect(executeSubscription).toHaveBeenCalledWith(
      {
        key: expect.any(Number),
        query: expect.any(Object),
        variables: { test: true },
      },
      undefined
    );

    expect(subscriber).toHaveBeenCalledTimes(5);
    expect(store.fetching).toBe(true);
    expect(store.data).toEqual({ test: true });
  });

  it('supports a custom scanning handler', () => {
    const subscriber = jest.fn();
    const subject = makeSubject<any>();
    const executeSubscription = jest
      .spyOn(client, 'executeSubscription')
      .mockImplementation(() => subject.source);

    const store = operationStore('subscription { counter }');
    store.subscribe(subscriber);

    subscription(store, (prev, current) => ({
      counter: (prev ? prev.counter : 0) + current.counter,
    }));

    expect(executeSubscription).toHaveBeenCalledWith(
      {
        key: expect.any(Number),
        query: expect.any(Object),
        variables: {},
      },
      undefined
    );

    subject.next({ data: { counter: 1 } });
    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(store.data).toEqual({ counter: 1 });

    subject.next({ data: { counter: 2 } });
    expect(subscriber).toHaveBeenCalledTimes(4);
    expect(store.data).toEqual({ counter: 3 });
  });
});

describe('mutation', () => {
  it('provides an execute method that resolves a promise', async () => {
    const subscriber = jest.fn();
    const subject = makeSubject<any>();
    const clientMutation = jest
      .spyOn(client, 'executeMutation')
      .mockImplementation((): any => subject.source);

    const store = operationStore('mutation { test }', { test: false });
    store.subscribe(subscriber);

    const start = mutation(store);
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(clientMutation).not.toHaveBeenCalled();

    const result$ = start({ test: true });
    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(store.fetching).toBe(true);
    expect(store.variables).toEqual({ test: true });

    subject.next({ data: { test: true } });
    expect(await result$).toEqual(store);

    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(store.fetching).toBe(false);
    expect(store.data).toEqual({ test: true });
  });
});

import { operationStore } from './operationStore';
import { _markStoreUpdate } from './internal';

it('instantiates an operation container acting as a store', () => {
  const variables = {};
  const context = {};
  const store = operationStore('{ test }', variables, context);

  expect(store.query).toBe('{ test }');
  expect(store.variables).toBe(variables);
  expect(store.context).toBe(context);

  const subscriber = jest.fn();

  store.subscribe(subscriber);

  expect(subscriber).toHaveBeenCalledWith(store);
  expect(subscriber).toHaveBeenCalledTimes(1);

  store.set({ query: '{ test2 }' });
  expect(subscriber).toHaveBeenCalledWith(store);
  expect(subscriber).toHaveBeenCalledTimes(2);
  expect(store.query).toBe('{ test2 }');
});

it('adds getters and setters for known values', () => {
  const variables = {};
  const context = {};
  const store = operationStore('{ test }', variables, context);

  const update = {
    query: '{ update }',
    variables: undefined,
    context: { requestPolicy: 'cache-and-network' },
    stale: true,
    fetching: true,
    data: { update: true },
    error: undefined,
    extensions: undefined,
  };

  _markStoreUpdate(update);
  store.set(update as any);

  expect(store.query).toBe(update.query);
  expect(store.variables).toEqual({});
  expect(store.context).toBe(update.context);
  expect(store.stale).toBe(update.stale);
  expect(store.fetching).toBe(update.fetching);
  expect(store.data).toBe(update.data);
  expect(store.error).toBe(update.error);
  expect(store.extensions).toBe(update.extensions);

  const subscriber = jest.fn();
  store.subscribe(subscriber);
  expect(subscriber).toHaveBeenCalledTimes(1);

  const state = subscriber.mock.calls[0][0];
  expect(state.stale).toBe(true);
  expect(state.query).toBe('{ update }');

  store.query = '{ imperative }';
  expect(subscriber).toHaveBeenCalledTimes(2);
  expect(store.query).toBe('{ imperative }');
});

it('adds stale when not present in update', () => {
  const variables = {};
  const context = {};
  const store = operationStore('{ test }', variables, context);

  const update = {
    query: '{ update }',
    variables: undefined,
    context: { requestPolicy: 'cache-and-network' },
    fetching: true,
    data: { update: true },
    error: undefined,
    extensions: undefined,
  };

  _markStoreUpdate(update);
  store.set(update as any);

  expect(store.query).toBe(update.query);
  expect(store.variables).toEqual({});
  expect(store.context).toBe(update.context);
  expect(store.stale).toBe(false);
  expect(store.fetching).toBe(update.fetching);
  expect(store.data).toBe(update.data);
  expect(store.error).toBe(update.error);
  expect(store.extensions).toBe(update.extensions);

  const subscriber = jest.fn();
  store.subscribe(subscriber);
  expect(subscriber).toHaveBeenCalledTimes(1);

  const state = subscriber.mock.calls[0][0];
  expect(state.stale).toBe(false);
  expect(state.query).toBe('{ update }');

  store.query = '{ imperative }';
  expect(subscriber).toHaveBeenCalledTimes(2);
  expect(store.query).toBe('{ imperative }');
});

it('throws when illegal values are set', () => {
  const store = operationStore('{ test }');

  expect(() => {
    (store as any).variables = {};
  }).not.toThrow();

  expect(() => {
    (store as any).data = {};
  }).toThrow();

  expect(() => {
    (store as any).set({ error: null });
  }).toThrow();
});

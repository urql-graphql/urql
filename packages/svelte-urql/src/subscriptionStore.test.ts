import { createClient } from '@urql/core';
import { get } from 'svelte/store';
import { subscriptionStore } from './subscriptionStore';

describe('subscriptionStore', () => {
  const client = createClient({ url: 'https://example.com' });
  const variables = {};
  const context = {};
  const subscription = `subscription ($input: ExampleInput) { exampleSubscribe(input: $input) { data } }`;
  const store = subscriptionStore({
    client,
    subscription,
    variables,
    context,
  });

  it('creates a svelte store', () => {
    const subscriber = jest.fn();
    store.subscribe(subscriber);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('fills the store with correct values', () => {
    expect(get(store).operation.kind).toBe('subscription');
    expect(get(store).operation.context.url).toBe('https://example.com');
    expect(get(store).operation.query.loc?.source.body).toBe(subscription);
    expect(get(store).operation.variables).toBe(variables);
  });
});

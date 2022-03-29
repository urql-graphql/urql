import { createClient } from '@urql/core';
import { get } from 'svelte/store';
import { mutationStore } from './mutationStore';

describe('mutationStore', () => {
  const client = createClient({ url: 'https://example.com' });
  const variables = {};
  const context = {};
  const mutation =
    'mutation ($input: Example!) { doExample(input: $input) { id } }';
  const store = mutationStore({
    client,
    mutation,
    variables,
    context,
  });

  it('creates a svelte store', () => {
    const subscriber = jest.fn();
    store.subscribe(subscriber);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('fills the store with correct values', () => {
    expect(get(store).operation.kind).toBe('mutation');
    expect(get(store).operation.context.url).toBe('https://example.com');
    expect(get(store).operation.query.loc?.source.body).toBe(mutation);
    expect(get(store).operation.variables).toBe(variables);
  });
});

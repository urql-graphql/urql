import { print } from 'graphql';
import { createClient } from '@urql/core';
import { get } from 'svelte/store';
import { vi, expect, it, describe } from 'vitest';

import { mutationStore } from './mutationStore';

describe('mutationStore', () => {
  const client = createClient({
    url: 'noop',
    exchanges: [],
  });

  const variables = {};
  const context = {};

  const query =
    'mutation ($input: Example!) { doExample(input: $input) { id } }';
  const store = mutationStore({
    client,
    query,
    variables,
    context,
  });

  it('creates a svelte store', () => {
    const subscriber = vi.fn();
    store.subscribe(subscriber);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('fills the store with correct values', () => {
    expect(get(store).operation.kind).toBe('mutation');
    expect(get(store).operation.context.url).toBe('noop');
    expect(get(store).operation.variables).toBe(variables);

    expect(print(get(store).operation.query)).toMatchInlineSnapshot(`
      "mutation ($input: Example!) {
        doExample(input: $input) {
          id
        }
      }"
    `);
  });
});

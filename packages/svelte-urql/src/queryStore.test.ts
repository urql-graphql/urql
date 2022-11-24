import { createClient } from '@urql/core';
import { vi, expect, it, describe } from 'vitest';
import { get } from 'svelte/store';

import { queryStore } from './queryStore';

describe('queryStore', () => {
  const client = createClient({ url: 'https://example.com' });
  const variables = {};
  const context = {};
  const query = '{ test }';
  const store = queryStore({ client, query, variables, context });

  it('creates a svelte store', () => {
    const subscriber = vi.fn();
    store.subscribe(subscriber);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('fills the store with correct values', () => {
    expect(get(store).operation.kind).toBe('query');
    expect(get(store).operation.context.url).toBe('https://example.com');
    expect(get(store).operation.query.loc?.source.body).toBe(query);
    expect(get(store).operation.variables).toBe(variables);
  });

  it('adds pause handles', () => {
    expect(get(store.isPaused$)).toBe(false);

    store.pause();
    expect(get(store.isPaused$)).toBe(true);

    store.resume();
    expect(get(store.isPaused$)).toBe(false);
  });
});

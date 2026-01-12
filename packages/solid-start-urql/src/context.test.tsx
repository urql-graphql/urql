// @vitest-environment jsdom

import { expect, it, describe } from 'vitest';
import { Provider, useClient } from './context';
import { renderHook } from '@solidjs/testing-library';
import { createClient } from '@urql/core';

describe('context', () => {
  it('should provide client through context', () => {
    const client = createClient({
      url: '/graphql',
      exchanges: [],
    });

    // Mock query function that matches the expected type
    const mockQuery = (fn: any) => fn;

    const wrapper = (props: { children: any }) => (
      <Provider value={{ client, query: mockQuery as any }}>
        {props.children}
      </Provider>
    );

    const { result } = renderHook(() => useClient(), { wrapper });

    expect(result).toBe(client);
  });

  it('should throw error when client is not provided', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    expect(() => {
      renderHook(() => useClient());
    }).toThrow();

    process.env.NODE_ENV = originalEnv;
  });
});

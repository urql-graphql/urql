// @vitest-environment jsdom

import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, beforeEach } from 'vitest';
import { Client, cacheExchange, Operation, Exchange } from '@urql/core';
import { delay, map, pipe } from 'wonka';

import { Provider } from '../context';
import { useQuery } from './useQuery';

const mockExchange: Exchange = () => ops$ => {
  return pipe(
    ops$,
    delay(100),
    map((operation: Operation) => ({
      operation,
      data: { activeFeatureFlags: [] },
      stale: false,
      hasNext: false,
    }))
  );
};

function useFeature() {
  const [result] = useQuery({
    query: `
      query activeFeatureFlags {
        activeFeatureFlags
      }
    `,
  });

  return { fetching: result.fetching };
}

function ReproComponent() {
  // Nested usage of the same hook (and query)
  useFeature();
  return <p>Check console</p>;
}

function Repro() {
  const { fetching } = useFeature();

  if (fetching) return <>Loading ...</>;
  return <ReproComponent />;
}

describe('component update warning', () => {
  let client: Client;

  beforeEach(() => {
    client = new Client({
      url: 'https://example.com/graphql',
      exchanges: [cacheExchange, mockExchange],
    });
  });

  it('does not warn when the same query is used in parent and child', async () => {
    const { findByText, debug } = render(
      <Provider value={client}>
        <Repro />
      </Provider>
    );

    // Wait for the component to finish loading and render the child
    await findByText('Check console');

    debug();
  });
});

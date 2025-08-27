// @vitest-environment jsdom

import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';

import { useQuery } from './useQuery';

// Mock the client so we can exercise useQuery without a real Client instance
vi.mock('../context', async () => {
  const { fromValue } = await vi.importActual<typeof import('wonka')>('wonka');

  const mock = {
    // Emit a synchronous result so the parent can quickly flip from loading to not loading
    executeQuery: vi.fn(() => fromValue({ data: { activeFeatureFlags: [] } })),
  } as const;

  return {
    useClient: () => mock,
  };
});

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

describe('useQuery cross-component update warning', () => {
  it('does not warn when the same query is used in parent and child', () => {
    // Our global test setup throws when console.error is called.
    // If React emits "Cannot update a component ... while rendering a different component ...",
    // this render will throw and the test will fail, capturing the regression.
    render(<Repro />);
  });
});


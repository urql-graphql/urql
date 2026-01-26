// @vitest-environment jsdom
import {
  vi,
  expect,
  it,
  describe,
  beforeAll,
  beforeEach,
  afterEach,
} from 'vitest';
import * as React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { gql } from '@urql/core';

import { Provider } from '../context';
import { useQuery } from './useQuery';
import {
  createFetchMockController,
  createTestClient,
  setupSuspenseTestEnvironment,
  assertSuspenseInvariant,
  FetchMockController,
  Fallback,
} from './suspense-test-utils.js';

const abort = vi.fn();

describe('useQuery suspense with graphcache', () => {
  let fetchMock: FetchMockController;

  beforeAll(() => {
    setupSuspenseTestEnvironment(abort);
  });

  beforeEach(() => {
    fetchMock = createFetchMockController();
  });

  afterEach(() => {
    fetchMock.reset();
    abort.mockClear();
  });

  it('displays existing data after a mutation adds a new item of the same type', async () => {
    const client = createTestClient({ useGraphcache: true });

    const authorsQuery = gql`
      query AuthorsQuery {
        authors {
          id
          name
        }
      }
    `;

    const addAuthorMutation = gql`
      mutation AddAuthor {
        addAuthor {
          id
          name
        }
      }
    `;

    const AuthorsList = () => {
      const [result] = useQuery({ query: authorsQuery });
      assertSuspenseInvariant(result);
      return (
        <div data-testid="authors">
          {result.data?.authors?.map((a: any) => a.name).join(', ') ??
            'no data'}
        </div>
      );
    };

    // Step 1: Render the query component and populate cache with existing authors
    const { unmount } = render(
      <Provider value={client}>
        <React.Suspense fallback={<Fallback />}>
          <AuthorsList />
        </React.Suspense>
      </Provider>
    );

    // Wait for initial query to be sent
    await waitFor(() => {
      expect(fetchMock.requests.length).toBe(1);
    });

    // Respond with initial author list
    await act(async () => {
      fetchMock.respondToLatest({
        __typename: 'Query',
        authors: [{ __typename: 'Author', id: '1', name: 'Author One' }],
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('authors').textContent).toBe('Author One');
    });

    unmount();

    // Execute a mutation that creates a NEW author (id: '2')
    const mutationPromise = client.mutation(addAuthorMutation, {}).toPromise();

    await waitFor(() => {
      expect(fetchMock.requests.length).toBe(2);
    });

    await act(async () => {
      fetchMock.respondToLatest({
        __typename: 'Mutation',
        addAuthor: { __typename: 'Author', id: '2', name: 'Author Two' },
      });
    });

    await mutationPromise;

    // Re-render the query component to verify existing data is intact
    render(
      <Provider value={client}>
        <React.Suspense fallback={<Fallback />}>
          <AuthorsList />
        </React.Suspense>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authors').textContent).toBe('Author One');
    });
  });
});

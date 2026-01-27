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

  it.fails(
    'BUG #3842: suspense should not render with data=null after cache invalidation',
    async () => {
      // This directly tests the bug mechanism from https://github.com/urql-graphql/urql/issues/3842
      //
      // The issue is in useQuery's getSnapshot function:
      // 1. When suspense is true and no cached result, it creates a promise and throws it
      // 2. The source subscription resolves that promise with the first result
      // 3. If that first result has data=null, the promise resolves with data=null
      // 4. On next render, the cache returns this resolved promise's value (data=null)
      // 5. The component renders with data=null instead of suspending
      //
      // To trigger this, we need graphcache to emit a result with data=null
      // This happens when it cannot resolve a query from cache (cache miss)

      const client = createTestClient({
        useGraphcache: true,
        cacheOpts: {
          // Force cache miss by invalidating immediately
          updates: {
            Mutation: {
              forceInvalidate: (_result, _args, cache) => {
                cache
                  .inspectFields('Query')
                  .filter(field => field.fieldName === 'authors')
                  .forEach(field => {
                    cache.invalidate('Query', field.fieldName, field.arguments);
                  });
              },
            },
          },
        },
      });

      const authorsQuery = gql`
        query AuthorsQuery {
          authors {
            id
            name
          }
        }
      `;

      const forceInvalidateMutation = gql`
        mutation ForceInvalidate {
          forceInvalidate
        }
      `;

      const renderStates: Array<{
        data: unknown;
        error: unknown;
        fetching: boolean;
      }> = [];

      const AuthorsList = () => {
        const [result] = useQuery({
          query: authorsQuery,
          // Use cache-and-network to get both cache and network results
          requestPolicy: 'cache-and-network',
        });

        renderStates.push({
          data: result.data,
          error: result.error,
          fetching: result.fetching,
        });

        assertSuspenseInvariant(result);

        return (
          <div data-testid="authors">
            {result.data?.authors?.map((a: any) => a.name).join(', ') ??
              'empty'}
          </div>
        );
      };

      // Step 1: Populate cache
      render(
        <Provider value={client}>
          <React.Suspense fallback={<Fallback />}>
            <AuthorsList />
          </React.Suspense>
        </Provider>
      );

      await waitFor(() => {
        expect(fetchMock.requests.length).toBeGreaterThanOrEqual(1);
      });

      await act(async () => {
        fetchMock.respondToLatest({
          __typename: 'Query',
          authors: [{ __typename: 'Author', id: '1', name: 'Author One' }],
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('authors').textContent).toBe('Author One');
      });

      // Clear states
      renderStates.length = 0;

      // Step 2: Invalidate cache while component is mounted
      const mutationPromise = client
        .mutation(forceInvalidateMutation, {})
        .toPromise();

      await waitFor(() => {
        expect(fetchMock.requests.length).toBeGreaterThanOrEqual(2);
      });

      await act(async () => {
        fetchMock.respondToLatest({
          __typename: 'Mutation',
          forceInvalidate: true,
        });
      });

      await mutationPromise;

      // Check if any render had data=null/undefined without error
      const buggyRender = renderStates.find(
        state =>
          (state.data === undefined || state.data === null) &&
          state.error === undefined
      );

      if (buggyRender) {
        throw new Error(
          `BUG REPRODUCED: Suspense invariant violated! ` +
            `Component rendered with data=${JSON.stringify(buggyRender.data)}, ` +
            `error=${buggyRender.error}, fetching=${buggyRender.fetching}`
        );
      }

      // Respond to any pending refetch
      const pendingRequests = fetchMock.requests.filter(r => !r.resolved);
      for (const req of pendingRequests) {
        await act(async () => {
          req.resolve({
            data: {
              __typename: 'Query',
              authors: [],
            },
          });
          (req as any).resolved = true;
        });
      }

      // Final state
      await waitFor(() => {
        const content = screen.getByTestId('authors').textContent;
        expect(content === 'Author One' || content === 'empty').toBeTruthy();
      });
    }
  );
});

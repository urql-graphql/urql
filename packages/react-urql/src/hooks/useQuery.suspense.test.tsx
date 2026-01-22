// @vitest-environment jsdom
import { vi, expect, it, describe, beforeAll } from 'vitest';
import * as React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { makeSubject, merge, filter, pipe, map, share } from 'wonka';
import {
  Client,
  CombinedError,
  Exchange,
  gql,
  Operation,
  OperationResult,
} from '@urql/core';

import { Provider } from '../context';
import { useQuery, UseQueryExecute } from './useQuery';

/**
 * Creates an exchange that allows manual control over results.
 * First emits a partial result { fetching: true } synchronously,
 * then waits for manual emission via the subject.
 * Only emits partial result for each unique operation key once.
 */
const createPartialThenControllableExchange = (
  resultSubject: ReturnType<typeof makeSubject<OperationResult>>
): Exchange => {
  const seenOperationKeys = new Set<number>();

  return () => {
    return ops$ => {
      const sharedOps$ = pipe(ops$, share);

      return merge([
        // Emit partial result immediately for each operation (only once per key)
        pipe(
          sharedOps$,
          filter(op => {
            if (op.kind === 'teardown') return false;
            if (seenOperationKeys.has(op.key)) return false;
            seenOperationKeys.add(op.key);
            return true;
          }),
          map(
            (operation): OperationResult => ({
              operation,
              data: undefined,
              error: undefined,
              stale: false,
              hasNext: false,
            })
          )
        ),
        // Also allow manual results from the subject
        resultSubject.source,
      ]);
    };
  };
};

const assertSuspenseInvariant = (
  pause: boolean,
  data: unknown,
  error: unknown
) => {
  if (!pause && !data && !error) {
    throw new Error(
      'Invariant violation: component rendered without data or error while not paused. ' +
        'With suspense enabled, the component should remain suspended until data or error arrives.'
    );
  }
};

describe('useQuery suspense', () => {
  beforeAll(() => {
    vi.spyOn(globalThis.console, 'error').mockImplementation(() => {
      // suppress React error boundary warnings in tests
    });
  });

  it('should keep suspending when partial result without data or error is emitted', async () => {
    const resultSubject = makeSubject<OperationResult>();
    let capturedOperation: Operation | undefined;

    const captureOperationExchange: Exchange = ({ forward }) => {
      return ops$ => {
        return pipe(
          ops$,
          map(op => {
            if (op.kind !== 'teardown') {
              capturedOperation = op;
            }
            return op;
          }),
          forward
        );
      };
    };

    const client = new Client({
      url: 'http://localhost:3000/graphql',
      suspense: true,
      exchanges: [
        captureOperationExchange,
        createPartialThenControllableExchange(resultSubject),
      ],
    });

    const query = gql`
      query TestQuery {
        test
      }
    `;

    const TestComponent = () => {
      const [result] = useQuery({ query });
      return <div data-testid="data">{result.data?.test ?? 'no data'}</div>;
    };

    const Fallback = () => <div data-testid="fallback">Loading...</div>;

    render(
      <Provider value={client}>
        <React.Suspense fallback={<Fallback />}>
          <TestComponent />
        </React.Suspense>
      </Provider>
    );

    // Initially should be suspended (showing fallback)
    // The exchange immediately emits { data: undefined, error: undefined }
    // With the fix, this should NOT unsuspend the component
    expect(screen.getByTestId('fallback')).toBeDefined();

    // Wait a tick to ensure any potential unsuspension would have happened
    await waitFor(() => {
      expect(screen.queryByTestId('fallback')).not.toBeNull();
    });

    // Now emit the actual result with data
    expect(capturedOperation).toBeDefined();
    act(() => {
      resultSubject.next({
        operation: capturedOperation!,
        data: { test: 'hello' },
        stale: false,
        hasNext: false,
      });
    });

    // Now it should unsuspend and show data
    await waitFor(() => {
      expect(screen.getByTestId('data').textContent).toBe('hello');
    });
  });

  it('should unsuspend when error is received', async () => {
    const resultSubject = makeSubject<OperationResult>();
    let capturedOperation: Operation | undefined;

    const captureOperationExchange: Exchange = ({ forward }) => {
      return ops$ => {
        return pipe(
          ops$,
          map(op => {
            if (op.kind !== 'teardown') {
              capturedOperation = op;
            }
            return op;
          }),
          forward
        );
      };
    };

    const client = new Client({
      url: 'http://localhost:3000/graphql',
      suspense: true,
      exchanges: [
        captureOperationExchange,
        createPartialThenControllableExchange(resultSubject),
      ],
    });

    const query = gql`
      query TestQuery {
        test
      }
    `;

    const TestComponent = () => {
      const [result] = useQuery({ query });
      if (result.error) {
        return <div data-testid="error">{result.error.message}</div>;
      }
      if (result.data) {
        return <div data-testid="data">{result.data.test}</div>;
      }
      return <div data-testid="loading">loading state</div>;
    };

    const Fallback = () => <div data-testid="fallback">Loading...</div>;

    render(
      <Provider value={client}>
        <React.Suspense fallback={<Fallback />}>
          <TestComponent />
        </React.Suspense>
      </Provider>
    );

    // Initially should be suspended
    expect(screen.getByTestId('fallback')).toBeDefined();

    // Wait to ensure component stays suspended with partial result
    await waitFor(() => {
      expect(screen.queryByTestId('fallback')).not.toBeNull();
    });

    // Emit error result (without partial result first, to simplify)
    expect(capturedOperation).toBeDefined();
    act(() => {
      resultSubject.next({
        operation: capturedOperation!,
        data: undefined,
        error: new CombinedError({
          networkError: new Error('Test error'),
        }),
        stale: false,
        hasNext: false,
      });
    });

    // Should unsuspend and show error
    await waitFor(
      () => {
        // First check we're not in loading state anymore
        expect(screen.queryByTestId('fallback')).toBeNull();
        expect(screen.getByTestId('error')).toBeDefined();
      },
      { timeout: 3000 }
    );
  });

  describe('pause behavior', () => {
    it('should not suspend when initially paused', async () => {
      const resultSubject = makeSubject<OperationResult>();
      let capturedOperation: Operation | undefined;

      const captureOperationExchange: Exchange = ({ forward }) => {
        return ops$ => {
          return pipe(
            ops$,
            map(op => {
              if (op.kind !== 'teardown') {
                capturedOperation = op;
              }
              return op;
            }),
            forward
          );
        };
      };

      const client = new Client({
        url: 'http://localhost:3000/graphql',
        suspense: true,
        exchanges: [
          captureOperationExchange,
          createPartialThenControllableExchange(resultSubject),
        ],
      });

      const query = gql`
        query TestQuery {
          test
        }
      `;

      const TestComponent = () => {
        const [result] = useQuery({ query, pause: true });
        assertSuspenseInvariant(true, result.data, result.error);
        return (
          <div data-testid="data">
            fetching: {String(result.fetching)}, data: {result.data?.test ?? 'none'}
          </div>
        );
      };

      const Fallback = () => <div data-testid="fallback">Loading...</div>;

      render(
        <Provider value={client}>
          <React.Suspense fallback={<Fallback />}>
            <TestComponent />
          </React.Suspense>
        </Provider>
      );

      // Should NOT show fallback - component renders immediately when paused
      expect(screen.queryByTestId('fallback')).toBeNull();
      expect(screen.getByTestId('data').textContent).toContain('fetching: false');
      expect(screen.getByTestId('data').textContent).toContain('data: none');

      // No query should have been executed
      expect(capturedOperation).toBeUndefined();
    });

    it('should start suspending when unpaused', async () => {
      const resultSubject = makeSubject<OperationResult>();
      let capturedOperation: Operation | undefined;

      const captureOperationExchange: Exchange = ({ forward }) => {
        return ops$ => {
          return pipe(
            ops$,
            map(op => {
              if (op.kind !== 'teardown') {
                capturedOperation = op;
              }
              return op;
            }),
            forward
          );
        };
      };

      const client = new Client({
        url: 'http://localhost:3000/graphql',
        suspense: true,
        exchanges: [
          captureOperationExchange,
          createPartialThenControllableExchange(resultSubject),
        ],
      });

      const query = gql`
        query TestQuery {
          test
        }
      `;

      const TestComponent = ({ pause }: { pause: boolean }) => {
        const [result] = useQuery({ query, pause });
        assertSuspenseInvariant(pause, result.data, result.error);
        return <div data-testid="data">{result.data?.test ?? 'no data'}</div>;
      };

      const Fallback = () => <div data-testid="fallback">Loading...</div>;

      const { rerender } = render(
        <Provider value={client}>
          <React.Suspense fallback={<Fallback />}>
            <TestComponent pause={true} />
          </React.Suspense>
        </Provider>
      );

      // Initially not suspended when paused
      expect(screen.queryByTestId('fallback')).toBeNull();
      expect(screen.getByTestId('data')).toBeDefined();
      expect(capturedOperation).toBeUndefined();

      // Unpause - should start suspending
      rerender(
        <Provider value={client}>
          <React.Suspense fallback={<Fallback />}>
            <TestComponent pause={false} />
          </React.Suspense>
        </Provider>
      );

      // Should now be suspended
      await waitFor(() => {
        expect(screen.getByTestId('fallback')).toBeDefined();
      });

      // Query should have been executed
      expect(capturedOperation).toBeDefined();

      // Emit data
      act(() => {
        resultSubject.next({
          operation: capturedOperation!,
          data: { test: 'hello' },
          stale: false,
          hasNext: false,
        });
      });

      // Should unsuspend and show data
      await waitFor(() => {
        expect(screen.queryByTestId('fallback')).toBeNull();
        expect(screen.getByTestId('data').textContent).toBe('hello');
      });
    });

    it('should stop suspending when paused while suspended', async () => {
      const resultSubject = makeSubject<OperationResult>();

      const client = new Client({
        url: 'http://localhost:3000/graphql',
        suspense: true,
        exchanges: [createPartialThenControllableExchange(resultSubject)],
      });

      const query = gql`
        query TestQuery {
          test
        }
      `;

      const TestComponent = ({ pause }: { pause: boolean }) => {
        const [result] = useQuery({ query, pause });
        assertSuspenseInvariant(pause, result.data, result.error);
        return (
          <div data-testid="data">
            fetching: {String(result.fetching)}, data: {result.data?.test ?? 'none'}
          </div>
        );
      };

      const Fallback = () => <div data-testid="fallback">Loading...</div>;

      const { rerender } = render(
        <Provider value={client}>
          <React.Suspense fallback={<Fallback />}>
            <TestComponent pause={false} />
          </React.Suspense>
        </Provider>
      );

      // Initially suspended
      await waitFor(() => {
        expect(screen.getByTestId('fallback')).toBeDefined();
      });

      // Pause while suspended
      rerender(
        <Provider value={client}>
          <React.Suspense fallback={<Fallback />}>
            <TestComponent pause={true} />
          </React.Suspense>
        </Provider>
      );

      // Should stop suspending and show component
      await waitFor(() => {
        expect(screen.queryByTestId('fallback')).toBeNull();
        expect(screen.getByTestId('data').textContent).toContain('fetching: false');
        expect(screen.getByTestId('data').textContent).toContain('data: none');
      });
    });

    it('should keep data when paused after receiving data', async () => {
      const resultSubject = makeSubject<OperationResult>();
      let capturedOperation: Operation | undefined;

      const captureOperationExchange: Exchange = ({ forward }) => {
        return ops$ => {
          return pipe(
            ops$,
            map(op => {
              if (op.kind !== 'teardown') {
                capturedOperation = op;
              }
              return op;
            }),
            forward
          );
        };
      };

      const client = new Client({
        url: 'http://localhost:3000/graphql',
        suspense: true,
        exchanges: [
          captureOperationExchange,
          createPartialThenControllableExchange(resultSubject),
        ],
      });

      const query = gql`
        query TestQuery {
          test
        }
      `;

      const TestComponent = ({ pause }: { pause: boolean }) => {
        const [result] = useQuery({ query, pause });
        assertSuspenseInvariant(pause, result.data, result.error);
        return (
          <div data-testid="data">
            fetching: {String(result.fetching)}, data: {result.data?.test ?? 'none'}
          </div>
        );
      };

      const Fallback = () => <div data-testid="fallback">Loading...</div>;

      const { rerender } = render(
        <Provider value={client}>
          <React.Suspense fallback={<Fallback />}>
            <TestComponent pause={false} />
          </React.Suspense>
        </Provider>
      );

      // Wait for suspension
      await waitFor(() => {
        expect(screen.getByTestId('fallback')).toBeDefined();
      });

      // Emit data
      expect(capturedOperation).toBeDefined();
      act(() => {
        resultSubject.next({
          operation: capturedOperation!,
          data: { test: 'hello' },
          stale: false,
          hasNext: false,
        });
      });

      // Wait for data to render
      await waitFor(() => {
        expect(screen.queryByTestId('fallback')).toBeNull();
        expect(screen.getByTestId('data').textContent).toContain('data: hello');
      });

      // Now pause
      rerender(
        <Provider value={client}>
          <React.Suspense fallback={<Fallback />}>
            <TestComponent pause={true} />
          </React.Suspense>
        </Provider>
      );

      // Should still show data, not suspended
      await waitFor(() => {
        expect(screen.queryByTestId('fallback')).toBeNull();
        expect(screen.getByTestId('data').textContent).toContain('fetching: false');
        expect(screen.getByTestId('data').textContent).toContain('data: hello');
      });
    });

    it('should fetch data when executeQuery called while paused without suspending', async () => {
      const resultSubject = makeSubject<OperationResult>();
      let capturedOperation: Operation | undefined;
      let executeQuery: UseQueryExecute;

      const captureOperationExchange: Exchange = ({ forward }) => {
        return ops$ => {
          return pipe(
            ops$,
            map(op => {
              if (op.kind !== 'teardown') {
                capturedOperation = op;
              }
              return op;
            }),
            forward
          );
        };
      };

      const client = new Client({
        url: 'http://localhost:3000/graphql',
        suspense: true,
        exchanges: [
          captureOperationExchange,
          createPartialThenControllableExchange(resultSubject),
        ],
      });

      const query = gql`
        query TestQuery {
          test
        }
      `;

      const TestComponent = () => {
        const [result, execute] = useQuery({ query, pause: true });
        executeQuery = execute;
        return (
          <div data-testid="data">
            fetching: {String(result.fetching)}, data: {result.data?.test ?? 'none'}
          </div>
        );
      };

      const Fallback = () => <div data-testid="fallback">Loading...</div>;

      render(
        <Provider value={client}>
          <React.Suspense fallback={<Fallback />}>
            <TestComponent />
          </React.Suspense>
        </Provider>
      );

      // Initially not suspended
      expect(screen.queryByTestId('fallback')).toBeNull();
      expect(screen.getByTestId('data').textContent).toContain('fetching: false');
      expect(capturedOperation).toBeUndefined();

      // Call executeQuery manually while paused
      act(() => {
        executeQuery();
      });

      // Should NOT suspend (pause is still true, so memoized source is null)
      // Component should not be in fallback state
      expect(screen.queryByTestId('fallback')).toBeNull();

      // Query should have been executed
      expect(capturedOperation).toBeDefined();

      // Emit data
      act(() => {
        resultSubject.next({
          operation: capturedOperation!,
          data: { test: 'manual-fetch' },
          stale: false,
          hasNext: false,
        });
      });

      // Should show data without ever having suspended
      await waitFor(() => {
        expect(screen.queryByTestId('fallback')).toBeNull();
        expect(screen.getByTestId('data').textContent).toContain('data: manual-fetch');
      });
    });

    it('should handle multiple pause/unpause cycles', async () => {
      const resultSubject = makeSubject<OperationResult>();
      let capturedOperation: Operation | undefined;

      const captureOperationExchange: Exchange = ({ forward }) => {
        return ops$ => {
          return pipe(
            ops$,
            map(op => {
              if (op.kind !== 'teardown') {
                capturedOperation = op;
              }
              return op;
            }),
            forward
          );
        };
      };

      const client = new Client({
        url: 'http://localhost:3000/graphql',
        suspense: true,
        exchanges: [
          captureOperationExchange,
          createPartialThenControllableExchange(resultSubject),
        ],
      });

      const query = gql`
        query TestQuery {
          test
        }
      `;

      const TestComponent = ({ pause }: { pause: boolean }) => {
        const [result] = useQuery({ query, pause });
        assertSuspenseInvariant(pause, result.data, result.error);
        return (
          <div data-testid="data">
            fetching: {String(result.fetching)}, data: {result.data?.test ?? 'none'}
          </div>
        );
      };

      const Fallback = () => <div data-testid="fallback">Loading...</div>;

      const { rerender } = render(
        <Provider value={client}>
          <React.Suspense fallback={<Fallback />}>
            <TestComponent pause={true} />
          </React.Suspense>
        </Provider>
      );

      // Initially not suspended
      expect(screen.queryByTestId('fallback')).toBeNull();

      // Cycle 1: Unpause -> Pause while suspended
      rerender(
        <Provider value={client}>
          <React.Suspense fallback={<Fallback />}>
            <TestComponent pause={false} />
          </React.Suspense>
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('fallback')).toBeDefined();
      });

      rerender(
        <Provider value={client}>
          <React.Suspense fallback={<Fallback />}>
            <TestComponent pause={true} />
          </React.Suspense>
        </Provider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('fallback')).toBeNull();
        expect(screen.getByTestId('data').textContent).toContain('fetching: false');
      });

      // Cycle 2: Unpause -> Get data -> Pause
      rerender(
        <Provider value={client}>
          <React.Suspense fallback={<Fallback />}>
            <TestComponent pause={false} />
          </React.Suspense>
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('fallback')).toBeDefined();
      });

      expect(capturedOperation).toBeDefined();
      act(() => {
        resultSubject.next({
          operation: capturedOperation!,
          data: { test: 'cycle2-data' },
          stale: false,
          hasNext: false,
        });
      });

      await waitFor(() => {
        expect(screen.queryByTestId('fallback')).toBeNull();
        expect(screen.getByTestId('data').textContent).toContain('data: cycle2-data');
      });

      rerender(
        <Provider value={client}>
          <React.Suspense fallback={<Fallback />}>
            <TestComponent pause={true} />
          </React.Suspense>
        </Provider>
      );

      // Data should persist while paused
      await waitFor(() => {
        expect(screen.queryByTestId('fallback')).toBeNull();
        expect(screen.getByTestId('data').textContent).toContain('data: cycle2-data');
      });
    });

    it('should use new variables when unpaused after variable change', async () => {
      const resultSubject = makeSubject<OperationResult>();
      const capturedOperations: Operation[] = [];

      const captureOperationExchange: Exchange = ({ forward }) => {
        return ops$ => {
          return pipe(
            ops$,
            map(op => {
              if (op.kind !== 'teardown') {
                capturedOperations.push(op);
              }
              return op;
            }),
            forward
          );
        };
      };

      const client = new Client({
        url: 'http://localhost:3000/graphql',
        suspense: true,
        exchanges: [
          captureOperationExchange,
          createPartialThenControllableExchange(resultSubject),
        ],
      });

      const queryWithVars = gql`
        query TestQuery($id: ID!) {
          test(id: $id)
        }
      `;

      const TestComponent = ({ pause, id }: { pause: boolean; id: string }) => {
        const [result] = useQuery({
          query: queryWithVars,
          variables: { id },
          pause,
        });
        assertSuspenseInvariant(pause, result.data, result.error);
        return (
          <div data-testid="data">
            data: {result.data?.test ?? 'none'}
          </div>
        );
      };

      const Fallback = () => <div data-testid="fallback">Loading...</div>;

      const { rerender } = render(
        <Provider value={client}>
          <React.Suspense fallback={<Fallback />}>
            <TestComponent pause={true} id="1" />
          </React.Suspense>
        </Provider>
      );

      // Not suspended, no query executed
      expect(screen.queryByTestId('fallback')).toBeNull();
      expect(capturedOperations.length).toBe(0);

      // Change variables while paused
      rerender(
        <Provider value={client}>
          <React.Suspense fallback={<Fallback />}>
            <TestComponent pause={true} id="2" />
          </React.Suspense>
        </Provider>
      );

      // Still no query
      expect(capturedOperations.length).toBe(0);

      // Unpause
      rerender(
        <Provider value={client}>
          <React.Suspense fallback={<Fallback />}>
            <TestComponent pause={false} id="2" />
          </React.Suspense>
        </Provider>
      );

      // Should suspend and execute query with id="2"
      await waitFor(() => {
        expect(screen.getByTestId('fallback')).toBeDefined();
      });

      expect(capturedOperations.length).toBe(1);
      expect(capturedOperations[0].variables).toEqual({ id: '2' });
    });
  });
});

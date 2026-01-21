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
import { useQuery } from './useQuery';

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
});

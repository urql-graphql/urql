// @vitest-environment jsdom
import { vi, expect, it, describe, beforeAll } from 'vitest';
import * as React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { makeSubject, merge, map } from 'wonka';
import { Client, Exchange, gql, Operation, OperationResult } from '@urql/core';

import { Provider } from '../context';
import { useQuery } from './useQuery';

const query = gql`
  query TestQuery {
    test
  }
`;

const assertSuspenseInvariant = (data: unknown, error: unknown) => {
  if (!data && !error) {
    throw new Error(
      'Suspense invariant violation: component rendered without data or error. ' +
        'With suspense enabled, the component should remain suspended until data or error arrives.'
    );
  }
};

const TestComponent = () => {
  const [result] = useQuery({ query });
  assertSuspenseInvariant(result.data, result.error);
  return <div data-testid="data">{result.data?.test ?? 'no data'}</div>;
};

const Fallback = () => <div data-testid="fallback">Loading...</div>;

const createTestExchange = (
  resultSubject: ReturnType<typeof makeSubject<OperationResult>>,
  onOperation: (op: Operation) => void
): Exchange => {
  return () => ops$ =>
    merge([
      map((op: Operation) => {
        if (op.kind !== 'teardown') onOperation(op);
        return {
          operation: op,
          data: undefined,
          error: undefined,
          stale: false,
          hasNext: false,
        } as OperationResult;
      })(ops$),
      resultSubject.source,
    ]);
};

describe('useQuery suspense', () => {
  beforeAll(() => {
    vi.spyOn(globalThis.console, 'error').mockImplementation(() => {});
  });

  it('should keep suspending when partial result without data or error is emitted', async () => {
    const resultSubject = makeSubject<OperationResult>();
    let capturedOperation: Operation | undefined;

    const client = new Client({
      url: 'http://localhost:3000/graphql',
      suspense: true,
      exchanges: [
        createTestExchange(resultSubject, op => (capturedOperation = op)),
      ],
    });

    render(
      <Provider value={client}>
        <React.Suspense fallback={<Fallback />}>
          <TestComponent />
        </React.Suspense>
      </Provider>
    );

    expect(screen.getByTestId('fallback')).toBeDefined();
    await waitFor(() => {
      expect(screen.queryByTestId('fallback')).not.toBeNull();
    });

    expect(capturedOperation).toBeDefined();
    act(() => {
      resultSubject.next({
        operation: capturedOperation!,
        data: { test: 'hello' },
        stale: false,
        hasNext: false,
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('data').textContent).toBe('hello');
    });
  });
});

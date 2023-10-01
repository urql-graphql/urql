import { describe, it, vi } from 'vitest';
import {
  OperationResult,
  OperationResultSource,
  createClient,
} from '@urql/core';
import { createQuery } from './createQuery';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import { Provider } from './context';
import { Suspense } from 'solid-js';
import { makeSubject } from 'wonka';

describe('createQuery suspense', () => {
  it('should not suspend', async () => {
    const client = createClient({
      url: '/graphql',
      exchanges: [],
      suspense: false,
    });

    const subject =
      makeSubject<Pick<OperationResult<{ test: boolean }, any>, 'data'>>();
    vi.spyOn(client, 'executeQuery').mockImplementation(
      () => subject.source as OperationResultSource<OperationResult>
    );

    const Page = () => {
      const [state, refetch] = createQuery<
        { test: boolean },
        { variable: number }
      >({
        query: '{ test }',
      });

      return (
        <div>
          <button data-testid="refetch" onClick={refetch} />
          data: {String(state.data?.test)}
        </div>
      );
    };

    render(() => (
      <Provider value={client}>
        <Suspense fallback="loading">
          <Page />
        </Suspense>
      </Provider>
    ));

    subject.next({ data: { test: true } });
    await waitFor(() => screen.getByText('data: true'));

    fireEvent.click(screen.getByTestId('refetch'));

    subject.next({ data: { test: false } });
    await waitFor(() => screen.getByText('data: false'));
  });

  it('should suspend', async () => {
    const client = createClient({
      url: '/graphql',
      exchanges: [],
      suspense: true,
    });

    const subject =
      makeSubject<Pick<OperationResult<{ test: boolean }, any>, 'data'>>();
    vi.spyOn(client, 'executeQuery').mockImplementation(
      () => subject.source as OperationResultSource<OperationResult>
    );

    const Page = () => {
      const [state] = createQuery<{ test: boolean }, { variable: number }>({
        query: '{ test }',
      });

      return <div>data: {String(state.data?.test)}</div>;
    };

    render(() => (
      <Provider value={client}>
        <Suspense fallback="loading">
          <Page />
        </Suspense>
      </Provider>
    ));

    await waitFor(() => screen.getByText('loading'));

    subject.next({ data: { test: true } });
    await waitFor(() => screen.getByText('data: true'));
  });

  it('context suspend should override client suspend', async () => {
    const client = createClient({
      url: '/graphql',
      exchanges: [],
      suspense: false,
    });

    const subject =
      makeSubject<Pick<OperationResult<{ test: boolean }, any>, 'data'>>();
    vi.spyOn(client, 'executeQuery').mockImplementation(
      () => subject.source as OperationResultSource<OperationResult>
    );

    const Page = () => {
      const [state] = createQuery<{ test: boolean }, { variable: number }>({
        query: '{ test }',
        context: {
          suspense: true,
        },
      });

      return <div>data: {String(state.data?.test)}</div>;
    };

    render(() => (
      <Provider value={client}>
        <Suspense fallback="loading">
          <Page />
        </Suspense>
      </Provider>
    ));

    await waitFor(() => screen.getByText('loading'));

    subject.next({ data: { test: true } });
    await waitFor(() => screen.getByText('data: true'));
  });
});

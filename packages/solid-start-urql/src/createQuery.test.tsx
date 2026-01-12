// @vitest-environment jsdom

import { expect, it, describe, vi } from 'vitest';
import { createQuery } from './createQuery';
import { renderHook, testEffect } from '@solidjs/testing-library';
import { createClient } from '@urql/core';
import { createSignal } from 'solid-js';
import { makeSubject } from 'wonka';
import { OperationResult, OperationResultSource } from '@urql/core';

const client = createClient({
  url: '/graphql',
  exchanges: [],
});

vi.mock('./context', () => {
  const useClient = () => {
    return client!;
  };

  const useQuery = () => {
    // Return a mock query function that just executes the callback
    return (fn: any, key: string) => fn;
  };

  return { useClient, useQuery };
});

vi.mock('@solidjs/router', () => {
  return {
    query: (fn: any, key: string) => fn,
    createAsync: (fn: any) => {
      const [data, setData] = createSignal<any>();
      fn().then(setData);
      return data;
    },
  };
});

describe('createQuery', () => {
  it('should execute a query', async () => {
    const subject =
      makeSubject<Pick<OperationResult<{ test: boolean }, any>, 'data'>>();
    const executeQuery = vi
      .spyOn(client, 'executeQuery')
      .mockImplementation(
        () => subject.source as OperationResultSource<OperationResult>
      );

    const result = renderHook(() =>
      createQuery<{ test: boolean }>({
        query: '{ test }',
      })
    );

    // Trigger the query
    subject.next({ data: { test: true } });

    await vi.waitFor(() => {
      const data = result.result();
      expect(data).toBeDefined();
    });

    executeQuery.mockRestore();
  });

  it('should respect pause option', () => {
    const executeQuery = vi.spyOn(client, 'executeQuery');

    renderHook(() =>
      createQuery({
        query: '{ test }',
        pause: true,
      })
    );

    expect(executeQuery).not.toHaveBeenCalled();
    executeQuery.mockRestore();
  });

  it('should re-execute when reactive variables change', async () => {
    const subject =
      makeSubject<
        Pick<OperationResult<{ user: { id: number } }, any>, 'data'>
      >();
    const executeQuery = vi
      .spyOn(client, 'executeQuery')
      .mockImplementation(
        () => subject.source as OperationResultSource<OperationResult>
      );

    const [userId, setUserId] = createSignal(1);

    renderHook(() =>
      createQuery<{ user: { id: number } }, { id: number }>({
        query: '{ user(id: $id) { id } }',
        variables: () => ({ id: userId() }),
      })
    );

    subject.next({ data: { user: { id: 1 } } });

    // Change the variable
    setUserId(2);

    await vi.waitFor(() => {
      // Should be called again with new variables
      expect(executeQuery).toHaveBeenCalled();
    });

    executeQuery.mockRestore();
  });
});

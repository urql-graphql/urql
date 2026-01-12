// @vitest-environment jsdom

import { expect, it, describe, vi, beforeEach } from 'vitest';
import { createMutation } from './createMutation';
import { testEffect } from '@solidjs/testing-library';
import { createClient } from '@urql/core';
import { createEffect, createSignal } from 'solid-js';
import { makeSubject } from 'wonka';
import { OperationResult } from '@urql/core';

const client = createClient({
  url: '/graphql',
  exchanges: [],
});

vi.mock('./context', () => {
  const useClient = () => {
    return client!;
  };

  return { useClient };
});

// Mock SolidStart router functions
let mockSubmission: any;

vi.mock('@solidjs/router', () => {
  return {
    action: (fn: any) => fn,
    useAction: (fn: any) => fn,
    useSubmission: () => mockSubmission[0],
  };
});

// Helper to mark all state dependencies for tracking
const markStateDependencies = (state: any) => {
  state.data;
  state.error;
  state.extensions;
  state.fetching;
  state.stale;
  state.hasNext;
};

describe('createMutation', () => {
  beforeEach(() => {
    // Reset submission signal before each test
    mockSubmission = createSignal<{
      pending: boolean;
      result: any;
    }>({
      pending: false,
      result: undefined,
    });
  });

  it('should execute a mutation', () => {
    const subject =
      makeSubject<OperationResult<{ addTodo: { id: number } }, any>>();

    const mutationSpy = vi
      .spyOn(client, 'executeMutation')
      .mockImplementation(() => subject.source as any);

    return testEffect(done => {
      const [state, executeMutation] = createMutation<
        { addTodo: { id: number } },
        { title: string }
      >('mutation AddTodo($title: String!) { addTodo(title: $title) { id } }');

      createEffect((run: number = 0) => {
        markStateDependencies(state);

        switch (run) {
          case 0: {
            // Initial state
            expect(state.fetching).toEqual(false);
            expect(state.data).toBeUndefined();

            // Execute the mutation
            executeMutation({ title: 'Test Todo' });
            break;
          }

          case 1: {
            // Should be fetching
            expect(state.fetching).toEqual(true);

            // Emit result
            subject.next({
              data: { addTodo: { id: 1 } },
              stale: false,
              hasNext: false,
            } as any);
            break;
          }

          case 2: {
            // Should have data
            expect(state.fetching).toEqual(false);
            expect(state.data).toEqual({ addTodo: { id: 1 } });
            done();
            break;
          }
        }

        return run + 1;
      });
    }).finally(() => mutationSpy.mockRestore());
  });

  it('should update fetching state', () => {
    const subject = makeSubject<OperationResult<any, any>>();

    const mutationSpy = vi
      .spyOn(client, 'executeMutation')
      .mockImplementation(() => subject.source as any);

    return testEffect(done => {
      const [state, executeMutation] = createMutation('mutation { test }');

      createEffect((run: number = 0) => {
        markStateDependencies(state);

        switch (run) {
          case 0: {
            expect(state.fetching).toEqual(false);
            // Execute mutation to trigger fetching state
            executeMutation({});
            break;
          }

          case 1: {
            expect(state.fetching).toEqual(true);
            done();
            break;
          }
        }

        return run + 1;
      });
    }).finally(() => mutationSpy.mockRestore());
  });

  it('should handle mutation errors', () => {
    const subject = makeSubject<OperationResult<any, any>>();

    const mutationSpy = vi
      .spyOn(client, 'executeMutation')
      .mockImplementation(() => subject.source as any);

    return testEffect(done => {
      const [state, executeMutation] = createMutation('mutation { test }');

      createEffect((run: number = 0) => {
        markStateDependencies(state);

        switch (run) {
          case 0: {
            expect(state.error).toBeUndefined();
            // Execute mutation
            executeMutation({});
            break;
          }

          case 1: {
            // Should be fetching
            expect(state.fetching).toEqual(true);
            // Emit error
            subject.next({
              data: undefined,
              error: {
                message: 'Error',
                graphQLErrors: [],
                networkError: undefined,
              } as any,
              stale: false,
              hasNext: false,
            } as any);
            break;
          }

          case 2: {
            expect(state.error).toBeDefined();
            expect(state.error?.message).toEqual('Error');
            expect(state.fetching).toEqual(false);
            done();
            break;
          }
        }

        return run + 1;
      });
    }).finally(() => mutationSpy.mockRestore());
  });
});

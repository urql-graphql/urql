// @vitest-environment jsdom

import { expect, it, describe, vi } from 'vitest';
import { createMutation } from './createMutation';
import { testEffect } from '@solidjs/testing-library';
import { createClient } from '@urql/core';
import { createEffect, createSignal } from 'solid-js';
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

  return { useClient };
});

// Mock SolidStart router functions
const mockSubmission = createSignal<{
  pending: boolean;
  result: any;
}>({
  pending: false,
  result: undefined,
});

vi.mock('@solidjs/router', () => {
  return {
    action: (fn: any) => fn,
    useAction: (fn: any) => fn,
    useSubmission: () => mockSubmission[0],
  };
});

describe('createMutation', () => {
  it('should execute a mutation', () => {
    const subject =
      makeSubject<
        Pick<OperationResult<{ addTodo: { id: number } }, any>, 'data'>
      >();
    vi.spyOn(client, 'mutation').mockImplementation(
      () => subject.source as OperationResultSource<OperationResult>
    );

    return testEffect(done => {
      const [state] = createMutation<
        { addTodo: { id: number } },
        { title: string }
      >('mutation AddTodo($title: String!) { addTodo(title: $title) { id } }');

      createEffect((run: number = 0) => {
        // Access state to track changes
        state.fetching;
        state.data;
        state.error;

        switch (run) {
          case 0: {
            expect(state.fetching).toEqual(false);
            expect(state.data).toBeUndefined();
            break;
          }
          case 1: {
            // Simulate mutation result
            subject.next({ data: { addTodo: { id: 1 } } });
            mockSubmission[1]({
              pending: false,
              result: { data: { addTodo: { id: 1 } }, error: undefined } as any,
            });
            break;
          }
          case 2: {
            expect(state.fetching).toEqual(false);
            expect(state.data).toEqual({ addTodo: { id: 1 } });
            done();
            break;
          }
        }

        return run + 1;
      });
    });
  });

  it('should update fetching state', () => {
    return testEffect(done => {
      const [state] = createMutation('mutation { test }');

      createEffect((run: number = 0) => {
        state.fetching;

        switch (run) {
          case 0: {
            expect(state.fetching).toEqual(false);
            // Simulate pending state
            mockSubmission[1]({ pending: true, result: undefined });
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
    });
  });

  it('should handle mutation errors', () => {
    return testEffect(done => {
      const [state] = createMutation('mutation { test }');

      createEffect((run: number = 0) => {
        state.error;

        switch (run) {
          case 0: {
            expect(state.error).toBeUndefined();
            // Simulate error
            mockSubmission[1]({
              pending: false,
              result: {
                data: undefined,
                error: {
                  message: 'Error',
                  graphQLErrors: [],
                  networkError: undefined,
                },
              } as any,
            });
            break;
          }
          case 1: {
            expect(state.error).toBeDefined();
            expect(state.error?.message).toEqual('Error');
            done();
            break;
          }
        }

        return run + 1;
      });
    });
  });
});

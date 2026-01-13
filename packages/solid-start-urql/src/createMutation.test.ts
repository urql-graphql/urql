// @vitest-environment jsdom

import { expect, it, describe, vi } from 'vitest';
import { createMutation } from './createMutation';
import { createClient } from '@urql/core';
import { makeSubject } from 'wonka';
import { OperationResult } from '@urql/core';

const client = createClient({
  url: '/graphql',
  exchanges: [],
});

vi.mock('./context', () => {
  return {
    useClient: () => client,
  };
});

// Mock SolidStart router functions
vi.mock('@solidjs/router', () => {
  return {
    action: (fn: any, _key?: string) => fn,
  };
});

describe('createMutation', () => {
  it('should create a mutation action', () => {
    const mutationAction = createMutation(
      'mutation AddTodo($title: String!) { addTodo(title: $title) { id } }',
      'add-todo'
    );

    expect(mutationAction).toBeDefined();
    expect(typeof mutationAction).toBe('function');
  });

  it('should execute a mutation through the action', async () => {
    const subject =
      makeSubject<OperationResult<{ addTodo: { id: number } }, any>>();

    const mutationSpy = vi
      .spyOn(client, 'executeMutation')
      .mockImplementation(() => subject.source as any);

    const mutationAction = createMutation<
      { addTodo: { id: number } },
      { title: string }
    >(
      'mutation AddTodo($title: String!) { addTodo(title: $title) { id } }',
      'add-todo'
    );

    const promise = mutationAction({ title: 'Test Todo' });

    // Emit result
    subject.next({
      data: { addTodo: { id: 1 } },
      stale: false,
      hasNext: false,
    } as any);

    const result = await promise;

    expect(mutationSpy).toHaveBeenCalled();
    expect(result.data).toEqual({ addTodo: { id: 1 } });

    mutationSpy.mockRestore();
  });

  it('should handle mutation errors', async () => {
    const subject = makeSubject<OperationResult<any, any>>();

    const mutationSpy = vi
      .spyOn(client, 'executeMutation')
      .mockImplementation(() => subject.source as any);

    const mutationAction = createMutation('mutation { test }', 'test');

    const promise = mutationAction({});

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

    const result = await promise;

    expect(result.error).toBeDefined();
    expect(result.error?.message).toEqual('Error');

    mutationSpy.mockRestore();
  });

  it('should pass context to mutation', async () => {
    const subject = makeSubject<OperationResult<any, any>>();

    const mutationSpy = vi
      .spyOn(client, 'executeMutation')
      .mockImplementation(() => subject.source as any);

    const mutationAction = createMutation('mutation { test }', 'test');

    const customContext = { requestPolicy: 'network-only' as const };
    const promise = mutationAction({}, customContext);

    // Emit result
    subject.next({
      data: { test: 'success' },
      stale: false,
      hasNext: false,
    } as any);

    await promise;

    expect(mutationSpy).toHaveBeenCalledWith(expect.anything(), customContext);

    mutationSpy.mockRestore();
  });
});

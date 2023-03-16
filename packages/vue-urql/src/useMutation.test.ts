import { OperationResult, OperationResultSource } from '@urql/core';
import { reactive } from 'vue';
import { vi, expect, it, beforeEach, describe } from 'vitest';

vi.mock('./useClient.ts', async () => {
  const { ref } = await vi.importActual<typeof import('vue')>('vue');
  return {
    __esModule: true,
    ...((await vi.importActual('./useClient.ts')) as object),
    useClient: () => ref(client),
  };
});

import { makeSubject } from 'wonka';
import { createClient, gql } from '@urql/core';
import { useMutation } from './useMutation';

const client = createClient({ url: '/graphql', exchanges: [] });

beforeEach(() => {
  vi.resetAllMocks();
});

describe('useMutation', () => {
  it('provides an execute method that resolves a promise', async () => {
    const subject = makeSubject<any>();
    const clientMutation = vi
      .spyOn(client, 'executeMutation')
      .mockImplementation(
        () => subject.source as OperationResultSource<OperationResult>
      );

    const mutation = reactive(
      useMutation(
        gql`
          mutation {
            test
          }
        `
      )
    );

    expect(mutation).toMatchObject({
      data: undefined,
      stale: false,
      fetching: false,
      error: undefined,
      extensions: undefined,
      operation: undefined,
      executeMutation: expect.any(Function),
    });

    const promise = mutation.executeMutation({ test: true });

    expect(mutation.fetching).toBe(true);
    expect(mutation.stale).toBe(false);
    expect(mutation.error).toBe(undefined);

    expect(clientMutation).toHaveBeenCalledTimes(1);

    subject.next({ data: { test: true } });
    await promise.then(function () {
      expect(mutation.fetching).toBe(false);
      expect(mutation.stale).toBe(false);
      expect(mutation.error).toBe(undefined);
      expect(mutation.data).toEqual({ test: true });
    });
  });
});

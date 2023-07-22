import { renderHook } from '@solidjs/testing-library';
import { expect, it, describe, vi } from 'vitest';
import { createMutation } from './createMutation';
import {
  OperationResult,
  OperationResultSource,
  createClient,
  gql,
} from '@urql/core';
import { makeSubject } from 'wonka';

const QUERY = gql`
  mutation {
    test
  }
`;

const client = createClient({
  url: '/graphql',
  exchanges: [],
  suspense: false,
});
vi.mock('./context', () => {
  const useClient = () => {
    return client!;
  };

  return { useClient };
});

describe('createMutation', () => {
  it('should have expected state before and after finish', async () => {
    const subject = makeSubject<any>();
    const clientMutation = vi
      .spyOn(client, 'executeMutation')
      .mockImplementation(
        () => subject.source as OperationResultSource<OperationResult>
      );

    const { result } = renderHook(() =>
      createMutation<{ test: boolean }, { variable: number }>(QUERY)
    );

    expect(result[0]).toMatchObject({
      data: undefined,
      stale: false,
      fetching: false,
      error: undefined,
      extensions: undefined,
      operation: undefined,
    });

    const promise = result[1]({ variable: 1 });

    expect(result[0]).toMatchObject({
      data: undefined,
      stale: false,
      fetching: true,
      error: undefined,
      extensions: undefined,
      operation: undefined,
    });

    expect(clientMutation).toHaveBeenCalledTimes(1);

    subject.next({ data: { test: true }, stale: false });
    await promise.then(got => {
      expect(got.stale).toBe(false);
      expect(got.error).toBe(undefined);
      expect(got.data).toEqual({ test: true });
    });

    expect(result[0].fetching).toBe(false);
    expect(result[0].stale).toBe(false);
    expect(result[0].error).toBe(undefined);
    expect(result[0].data).toEqual({ test: true });
  });
});

import { renderHook } from '@solidjs/testing-library';
import {
  OperationResult,
  OperationResultSource,
  createClient,
  createRequest,
  gql,
} from '@urql/core';
import { expect, it, describe, vi } from 'vitest';
import { makeSubject } from 'wonka';
import { createSubscription } from './createSubscription';

const QUERY = gql`
  subscription {
    value
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

describe('createSubscription', () => {
  it.only('should receive data', async () => {
    const subject =
      makeSubject<Pick<OperationResult<{ value: number }, any>, 'data'>>();
    const executeQuery = vi
      .spyOn(client, 'executeSubscription')
      .mockImplementation(
        () => subject.source as OperationResultSource<OperationResult>
      );

    const request = createRequest(QUERY, undefined);
    const operation = client.createRequestOperation('subscription', request);

    const { result } = renderHook(() =>
      createSubscription<{ value: number }, { variable: number }>({
        query: QUERY,
      })
    );

    expect(result[0]).toMatchObject({
      data: undefined,
      stale: false,
      fetching: true,
      operation: operation,
      error: undefined,
      extensions: undefined,
    });
    expect(result[1]).toEqual(expect.any(Function));

    expect(executeQuery).toHaveBeenCalledOnce();
    expect(client.executeSubscription).toBeCalledWith(
      {
        key: expect.any(Number),
        query: expect.any(Object),
        variables: {},
      },
      undefined
    );

    subject.next({ data: { value: 0 } });
    expect(result[0].data).toEqual({ value: 0 });

    subject.next({ data: { value: 1 } });
    expect(result[0].data).toEqual({ value: 1 });

    subject.complete();
    expect(result[0].fetching).toBe(false);
    expect(result[0].data).toEqual({ value: 1 });
  });
});

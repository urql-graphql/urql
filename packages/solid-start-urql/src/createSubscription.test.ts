// @vitest-environment jsdom

import { renderHook } from '@solidjs/testing-library';
import {
  OperationResult,
  OperationResultSource,
  createClient,
  gql,
} from '@urql/core';
import { expect, it, describe, vi } from 'vitest';
import { makeSubject } from 'wonka';
import { createSubscription } from './index';

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
  const useClient = () => client;

  return { useClient };
});

describe('createSubscription', () => {
  it('should execute against solid-start context client', () => {
    const subject =
      makeSubject<Pick<OperationResult<{ value: number }, any>, 'data'>>();
    const executeSubscription = vi
      .spyOn(client, 'executeSubscription')
      .mockImplementation(
        () => subject.source as OperationResultSource<OperationResult>
      );

    const {
      result: [state],
    } = renderHook(() =>
      createSubscription<{ value: number }, { variable: number }>({
        query: QUERY,
      })
    );

    expect(executeSubscription).toHaveBeenCalledOnce();

    subject.next({ data: { value: 1 } });

    expect(state.data).toEqual({ value: 1 });
  });
});

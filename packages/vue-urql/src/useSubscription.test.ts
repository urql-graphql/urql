// @vitest-environment jsdom

import { OperationResult, OperationResultSource } from '@urql/core';
import { nextTick, readonly, ref } from 'vue';
import { vi, expect, it, describe } from 'vitest';

vi.mock('./useClient.ts', async () => ({
  __esModule: true,
  ...(await vi.importActual<typeof import('./useClient')>('./useClient.ts')),
  useClient: () => ref(client),
}));

import { makeSubject } from 'wonka';
import { createClient } from '@urql/core';
import { useSubscription } from './useSubscription';

const client = createClient({ url: '/graphql', exchanges: [] });

describe('useSubscription', () => {
  it('subscribes to a subscription and updates data', async () => {
    const subject = makeSubject<any>();
    const executeQuery = vi
      .spyOn(client, 'executeSubscription')
      .mockImplementation(
        () => subject.source as OperationResultSource<OperationResult>
      );

    const sub = useSubscription({
      query: `{ test }`,
    });

    expect(readonly(sub)).toMatchObject({
      data: undefined,
      stale: false,
      fetching: true,
      error: undefined,
      extensions: undefined,
      operation: undefined,
      isPaused: false,
      pause: expect.any(Function),
      resume: expect.any(Function),
      executeSubscription: expect.any(Function),
    });

    expect(executeQuery).toHaveBeenCalledWith(
      {
        key: expect.any(Number),
        query: expect.any(Object),
        variables: {},
      },
      expect.any(Object)
    );

    expect(sub.fetching.value).toBe(true);

    subject.next({ data: { test: true } });
    expect(sub.data.value).toHaveProperty('test', true);

    subject.complete();
    expect(sub.fetching.value).toBe(false);
  });

  it('updates the executed subscription when inputs change', async () => {
    const subject = makeSubject<any>();
    const executeSubscription = vi
      .spyOn(client, 'executeSubscription')
      .mockImplementation(
        () => subject.source as OperationResultSource<OperationResult>
      );

    const variables = ref({});
    const sub = useSubscription({
      query: `{ test }`,
      variables,
    });

    expect(executeSubscription).toHaveBeenCalledWith(
      {
        key: expect.any(Number),
        query: expect.any(Object),
        variables: {},
      },
      expect.any(Object)
    );

    subject.next({ data: { test: true } });
    expect(sub.data.value).toHaveProperty('test', true);

    variables.value = { test: true };
    await nextTick();
    expect(executeSubscription).toHaveBeenCalledTimes(2);
    expect(executeSubscription).toHaveBeenCalledWith(
      {
        key: expect.any(Number),
        query: expect.any(Object),
        variables: { test: true },
      },
      expect.any(Object)
    );

    expect(sub.fetching.value).toBe(true);
    expect(sub.data.value).toHaveProperty('test', true);
  });

  it('supports a custom scanning handler', async () => {
    const subject = makeSubject<any>();
    const executeSubscription = vi
      .spyOn(client, 'executeSubscription')
      .mockImplementation(
        () => subject.source as OperationResultSource<OperationResult>
      );

    const scanHandler = (currentState: any, nextState: any) => ({
      counter: (currentState ? currentState.counter : 0) + nextState.counter,
    });

    const sub = useSubscription(
      {
        query: `subscription { counter }`,
      },
      scanHandler
    );

    expect(executeSubscription).toHaveBeenCalledWith(
      {
        key: expect.any(Number),
        query: expect.any(Object),
        variables: {},
      },
      expect.any(Object)
    );

    subject.next({ data: { counter: 1 } });
    expect(sub.data.value).toHaveProperty('counter', 1);

    subject.next({ data: { counter: 2 } });
    expect(sub.data.value).toHaveProperty('counter', 3);
  });
});

import { nextTick, reactive, ref } from 'vue';

vi.mock('./useClient.ts', async () => ({
  __esModule: true,
  ...(await vi.importActual('./useClient.ts')),
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
      .mockImplementation(() => subject.source);

    const sub = reactive(
      useSubscription({
        query: `{ test }`,
      })
    );

    expect(sub).toMatchObject({
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

    expect(sub.fetching).toBe(true);

    subject.next({ data: { test: true } });
    expect(sub.data).toEqual({ test: true });
    subject.complete();
    expect(sub.fetching).toBe(false);
  });

  it('updates the executed subscription when inputs change', async () => {
    const subject = makeSubject<any>();
    const executeSubscription = vi
      .spyOn(client, 'executeSubscription')
      .mockImplementation(() => subject.source);

    const variables = ref({});
    const sub = reactive(
      useSubscription({
        query: `{ test }`,
        variables,
      })
    );

    expect(executeSubscription).toHaveBeenCalledWith(
      {
        key: expect.any(Number),
        query: expect.any(Object),
        variables: {},
      },
      expect.any(Object)
    );

    subject.next({ data: { test: true } });
    expect(sub.data).toEqual({ test: true });

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

    expect(sub.fetching).toBe(true);
    expect(sub.data).toEqual({ test: true });
  });
  it('supports a custom scanning handler', async () => {
    const subject = makeSubject<any>();
    const executeSubscription = vi
      .spyOn(client, 'executeSubscription')
      .mockImplementation(() => subject.source);

    const scanHandler = (currentState: any, nextState: any) => ({
      counter: (currentState ? currentState.counter : 0) + nextState.counter,
    });
    const sub = reactive(
      useSubscription(
        {
          query: `subscription { counter }`,
        },
        scanHandler
      )
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
    expect(sub.data).toEqual({ counter: 1 });

    subject.next({ data: { counter: 2 } });
    expect(sub.data).toEqual({ counter: 3 });
  });
});

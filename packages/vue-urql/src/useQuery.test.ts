jest.mock('vue', () => {
  const vue = jest.requireActual('vue');

  return {
    __esModule: true,
    ...vue,
    inject: () => client,
  };
});
import { makeSubject } from 'wonka';
import { createClient } from '@urql/core';
import { useQuery } from './useQuery';
import { nextTick, reactive } from 'vue';

const client = createClient({ url: '/graphql', exchanges: [] });

describe('useQuery', () => {
  it('runs a query and updates data', async () => {
    const subject = makeSubject<any>();
    const executeQuery = jest
      .spyOn(client, 'executeQuery')
      .mockImplementation(() => subject.source);

    const _query = useQuery({
      query: `{ test }`,
    });
    const query = reactive(_query);

    expect(query).toMatchObject({
      data: undefined,
      stale: false,
      fetching: true,
      error: undefined,
      extensions: undefined,
      operation: undefined,
      isPaused: false,
      pause: expect.any(Function),
      resume: expect.any(Function),
      executeQuery: expect.any(Function),
      then: expect.any(Function),
    });

    expect(executeQuery).toHaveBeenCalledWith(
      {
        key: expect.any(Number),
        query: expect.any(Object),
        variables: {},
        context: undefined,
      },
      {
        pollInterval: undefined,
        requestPolicy: undefined,
      }
    );

    expect(query.fetching).toBe(true);

    subject.next({ data: { test: true } });

    expect(query.fetching).toBe(false);
    expect(query.data).toEqual({ test: true });
  });

  /*
   * This test currently fails for the following reasons:
   * with pause: false, `executeQuery` is called 3 times
   * with pause: true, the promise from useQuery never resolves
   *
   * it's unclear to me what the desired behaviour is supposed to be.
   * - If we want to have the query execute only once, we would have to set `pause: true`,
   *   but that seems counter-intuitive
   * - If we don't pause, I'd expect 2 calls:
   *   -  one from watchEffect
   *   -  one from useQuery().then()
   *   I can't say why it's 3 in the latter case-
   *
   */
  it.skip('runs Query and awaits results', async () => {
    const subject = makeSubject<any>();
    const executeQuery = jest
      .spyOn(client, 'executeQuery')
      .mockImplementation(() => {
        subject.next({ data: { test: true } });
        return subject.source;
      });

    const query = await useQuery({
      query: `{ test }`,
      // pause: true,
    });
    expect(executeQuery).toHaveBeenCalledTimes(1);
    expect(query.fetching.value).toBe(false);
    expect(query.data.value).toEqual({ test: true });
  });

  it('pauses query when asked to do so', async () => {
    const subject = makeSubject<any>();
    const executeQuery = jest
      .spyOn(client, 'executeQuery')
      .mockImplementation(() => subject.source);

    const _query = useQuery({
      query: `{ test }`,
      pause: true,
    });
    const query = reactive(_query);

    expect(executeQuery).not.toHaveBeenCalled();

    query.resume();
    await nextTick();
    expect(query.fetching).toBe(true);

    subject.next({ data: { test: true } });

    expect(query.fetching).toBe(false);
    expect(query.data).toEqual({ test: true });
  });

  it('updates when polling', async () => {
    const subject = makeSubject<any>();
    const executeQuery = jest
      .spyOn(client, 'executeQuery')
      .mockImplementation(() => subject.source);

    const _query = useQuery({
      query: `{ test }`,
      pollInterval: 500,
      requestPolicy: 'cache-first',
    });
    const query = reactive(_query);

    expect(executeQuery).toHaveBeenCalledWith(
      {
        key: expect.any(Number),
        query: expect.any(Object),
        variables: {},
        context: undefined,
      },
      {
        pollInterval: 500,
        requestPolicy: 'cache-first',
      }
    );

    expect(query.fetching).toBe(true);

    subject.next({ data: { test: true } });

    expect(query.fetching).toBe(false);
    expect(query.data).toEqual({ test: true });

    subject.next({ data: { test: false } });
    expect(query.data).toEqual({ test: false });
  });
});

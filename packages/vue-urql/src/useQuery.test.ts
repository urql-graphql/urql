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

  it('runs Query and awaits results', async () => {
    const subject = makeSubject<any>();
    const executeQuery = jest
      .spyOn(client, 'executeQuery')
      .mockImplementation(() => subject.source);

    const query = useQuery({
      query: `{ test }`,
      pause: true,
    });

    const promise = query.then(result => {
      expect(executeQuery).toHaveBeenCalled();
      expect(query.fetching.value).toBe(false);
      expect(result.data.value).toEqual({ test: true });
    });
    expect(query.fetching.value).toBe(true);
    subject.next({ data: { test: true } });

    return promise;
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

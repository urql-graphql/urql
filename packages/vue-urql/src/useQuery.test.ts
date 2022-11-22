import { nextTick, reactive, ref } from 'vue';

vi.mock('./useClient.ts', () => ({
  __esModule: true,
  ...require('./useClient.ts'),
  useClient: () => ref(client),
}));

import { pipe, makeSubject, fromValue, delay } from 'wonka';
import { createClient } from '@urql/core';
import { useQuery } from './useQuery';

const client = createClient({ url: '/graphql', exchanges: [] });

describe('useQuery', () => {
  it('runs a query and updates data', async () => {
    const subject = makeSubject<any>();
    const executeQuery = vi
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
        requestPolicy: undefined,
      }
    );

    expect(query.fetching).toBe(true);

    subject.next({ data: { test: true } });

    expect(query.fetching).toBe(false);
    expect(query.data).toEqual({ test: true });
  });

  it('runs queries as a promise-like that resolves when used', async () => {
    const executeQuery = vi
      .spyOn(client, 'executeQuery')
      .mockImplementation(() => {
        return pipe(fromValue({ data: { test: true } }), delay(1)) as any;
      });

    const query = await useQuery({
      query: `{ test }`,
    });

    expect(executeQuery).toHaveBeenCalledTimes(1);
    expect(query.fetching.value).toBe(false);
    expect(query.data.value).toEqual({ test: true });
  });

  it('runs queries as a promise-like that resolves even when the query changes', async () => {
    const executeQuery = vi
      .spyOn(client, 'executeQuery')
      .mockImplementation(request => {
        return pipe(
          fromValue({ operation: request, data: { test: true } }),
          delay(1)
        ) as any;
      });

    const doc = ref('{ test }');

    const query$ = useQuery({
      query: doc,
    });

    doc.value = '{ test2 }';

    await query$;

    expect(executeQuery).toHaveBeenCalledTimes(2);
    expect(query$.fetching.value).toBe(false);
    expect(query$.data.value).toEqual({ test: true });

    expect(query$.operation.value).toHaveProperty(
      'query.definitions.0.selectionSet.selections.0.name.value',
      'test2'
    );
  });

  it('pauses query when asked to do so', async () => {
    const subject = makeSubject<any>();
    const executeQuery = vi
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
});

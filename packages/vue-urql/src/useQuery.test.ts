import {
  OperationResult,
  OperationResultSource,
  RequestPolicy,
} from '@urql/core';
import { computed, nextTick, reactive, readonly, ref } from 'vue';
import { vi, expect, it, describe } from 'vitest';

vi.mock('./useClient.ts', async () => ({
  __esModule: true,
  ...(await vi.importActual<typeof import('./useClient')>('./useClient.ts')),
  useClient: () => ref(client),
}));

import { pipe, makeSubject, fromValue, delay } from 'wonka';
import { createClient } from '@urql/core';
import { useQuery, UseQueryArgs } from './useQuery';

const client = createClient({ url: '/graphql', exchanges: [] });

const createQuery = (args: UseQueryArgs) => {
  const executeQuery = vi
    .spyOn(client, 'executeQuery')
    .mockImplementation(request => {
      return pipe(
        fromValue({ operation: request, data: { test: true } }),
        delay(1)
      ) as any;
    });

  const query$ = useQuery(args);

  return {
    query$,
    executeQuery,
  };
};

describe('useQuery', () => {
  it('runs a query and updates data', async () => {
    const subject = makeSubject<any>();
    const executeQuery = vi
      .spyOn(client, 'executeQuery')
      .mockImplementation(
        () => subject.source as OperationResultSource<OperationResult>
      );

    const query = useQuery({
      query: `{ test }`,
    });

    expect(readonly(query)).toMatchObject({
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

    expect(query.fetching.value).toBe(true);

    subject.next({ data: { test: true } });

    expect(query.fetching.value).toBe(false);
    expect(query.data.value).toHaveProperty('test', true);
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
    const doc = ref('{ test }');

    const { executeQuery, query$ } = createQuery({
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

  it('reacts to ref variables changing', async () => {
    const variables = ref({ prop: 1 });

    const { executeQuery, query$ } = createQuery({
      query: ref('{ test }'),
      variables,
    });

    await query$;
    expect(executeQuery).toHaveBeenCalledTimes(1);
    expect(query$.operation.value).toHaveProperty('variables.prop', 1);

    variables.value.prop++;
    await query$;
    expect(executeQuery).toHaveBeenCalledTimes(2);
    expect(query$.operation.value).toHaveProperty('variables.prop', 2);

    variables.value = { prop: 3 };
    await query$;
    expect(executeQuery).toHaveBeenCalledTimes(3);
    expect(query$.operation.value).toHaveProperty('variables.prop', 3);
  });

  it('reacts to nested ref variables changing', async () => {
    const prop = ref(1);

    const { executeQuery, query$ } = createQuery({
      query: ref('{ test }'),
      variables: { prop },
    });

    await query$;
    expect(executeQuery).toHaveBeenCalledTimes(1);
    expect(query$.operation.value).toHaveProperty('variables.prop', 1);

    prop.value++;
    await query$;
    expect(executeQuery).toHaveBeenCalledTimes(2);
    expect(query$.operation.value).toHaveProperty('variables.prop', 2);
  });

  it('reacts to deep nested ref variables changing', async () => {
    const prop = ref(1);

    const { executeQuery, query$ } = createQuery({
      query: ref('{ test }'),
      variables: { deep: { nested: { prop } } },
    });

    await query$;
    expect(executeQuery).toHaveBeenCalledTimes(1);
    expect(query$.operation.value).toHaveProperty(
      'variables.deep.nested.prop',
      1
    );

    prop.value++;
    await query$;
    expect(executeQuery).toHaveBeenCalledTimes(2);
    expect(query$.operation.value).toHaveProperty(
      'variables.deep.nested.prop',
      2
    );
  });

  it('reacts to reactive variables changing', async () => {
    const prop = ref(1);
    const variables = reactive({ prop: 1, deep: { nested: { prop } } });

    const { executeQuery, query$ } = createQuery({
      query: ref('{ test }'),
      variables,
    });

    await query$;
    expect(executeQuery).toHaveBeenCalledTimes(1);
    expect(query$.operation.value).toHaveProperty('variables.prop', 1);

    variables.prop++;
    await query$;
    expect(executeQuery).toHaveBeenCalledTimes(2);
    expect(query$.operation.value).toHaveProperty('variables.prop', 2);

    prop.value++;
    await query$;
    expect(executeQuery).toHaveBeenCalledTimes(3);
    expect(query$.operation.value).toHaveProperty(
      'variables.deep.nested.prop',
      2
    );
  });

  it('reacts to computed variables changing', async () => {
    const prop = ref(1);
    const prop2 = ref(1);
    const variables = computed(() => ({
      prop: prop.value,
      deep: { nested: { prop2 } },
    }));

    const { executeQuery, query$ } = createQuery({
      query: ref('{ test }'),
      variables,
    });

    await query$;
    expect(executeQuery).toHaveBeenCalledTimes(1);
    expect(query$.operation.value).toHaveProperty('variables.prop', 1);

    prop.value++;
    await query$;
    expect(executeQuery).toHaveBeenCalledTimes(2);
    expect(query$.operation.value).toHaveProperty('variables.prop', 2);

    prop2.value++;
    await query$;
    expect(executeQuery).toHaveBeenCalledTimes(3);
    expect(query$.operation.value).toHaveProperty(
      'variables.deep.nested.prop2',
      2
    );
  });

  it('reacts to callback variables changing', async () => {
    const prop = ref(1);
    const prop2 = ref(1);
    const variables = () => ({
      prop: prop.value,
      deep: { nested: { prop2 } },
    });

    const { executeQuery, query$ } = createQuery({
      query: ref('{ test }'),
      variables,
    });

    await query$;
    expect(executeQuery).toHaveBeenCalledTimes(1);
    expect(query$.operation.value).toHaveProperty('variables.prop', 1);

    prop.value++;
    await query$;
    expect(executeQuery).toHaveBeenCalledTimes(2);
    expect(query$.operation.value).toHaveProperty('variables.prop', 2);

    prop2.value++;
    await query$;
    expect(executeQuery).toHaveBeenCalledTimes(3);
    expect(query$.operation.value).toHaveProperty(
      'variables.deep.nested.prop2',
      2
    );
  });

  it('reacts to reactive context argument', async () => {
    const context = ref<{ requestPolicy: RequestPolicy }>({
      requestPolicy: 'cache-only',
    });

    const { executeQuery, query$ } = createQuery({
      query: ref('{ test }'),
      context,
    });

    await query$;
    expect(executeQuery).toHaveBeenCalledTimes(1);

    context.value.requestPolicy = 'network-only';
    await query$;
    expect(executeQuery).toHaveBeenCalledTimes(2);
  });

  it('reacts to callback context argument', async () => {
    const requestPolicy = ref<RequestPolicy>('cache-only');

    const { executeQuery, query$ } = createQuery({
      query: ref('{ test }'),
      context: () => ({
        requestPolicy: requestPolicy.value,
      }),
    });

    await query$;
    expect(executeQuery).toHaveBeenCalledTimes(1);

    requestPolicy.value = 'network-only';
    await query$;
    expect(executeQuery).toHaveBeenCalledTimes(2);
  });

  it('pauses query when asked to do so', async () => {
    const subject = makeSubject<any>();
    const executeQuery = vi
      .spyOn(client, 'executeQuery')
      .mockImplementation(
        () => subject.source as OperationResultSource<OperationResult>
      );

    const query = useQuery({
      query: `{ test }`,
      pause: true,
    });

    expect(executeQuery).not.toHaveBeenCalled();

    query.resume();
    await nextTick();
    expect(query.fetching.value).toBe(true);

    subject.next({ data: { test: true } });

    expect(query.fetching.value).toBe(false);
    expect(query.data.value).toHaveProperty('test', true);
  });

  it('pauses query with ref variable', async () => {
    const pause = ref(true);

    const { executeQuery, query$ } = createQuery({
      query: ref('{ test }'),
      pause,
    });

    await query$;
    expect(executeQuery).not.toHaveBeenCalled();

    pause.value = false;
    await query$;
    expect(executeQuery).toHaveBeenCalledTimes(1);

    query$.pause();
    query$.resume();
    await query$;
    expect(executeQuery).toHaveBeenCalledTimes(2);
  });

  it('pauses query with computed variable', async () => {
    const pause = ref(true);

    const { executeQuery, query$ } = createQuery({
      query: ref('{ test }'),
      pause: computed(() => pause.value),
    });

    await query$;
    expect(executeQuery).not.toHaveBeenCalled();

    pause.value = false;
    await query$;
    expect(executeQuery).toHaveBeenCalledTimes(1);

    query$.pause();
    query$.resume();
    await query$;
    // this shouldn't be called, as pause/resume functionality should works in sync with passed `pause` variable, e.g.:
    // if we pass readonly computed variable, then we want to make sure that its value fully controls the state of the request.
    expect(executeQuery).toHaveBeenCalledTimes(1);
  });

  it('pauses query with callback', async () => {
    const pause = ref(true);

    const { executeQuery, query$ } = createQuery({
      query: ref('{ test }'),
      pause: () => pause.value,
    });

    await query$;
    expect(executeQuery).not.toHaveBeenCalled();

    pause.value = false;
    await query$;
    expect(executeQuery).toHaveBeenCalledTimes(1);

    query$.pause();
    query$.resume();
    await query$;
    // the same as computed variable example - user has full control over the request state if using callback
    expect(executeQuery).toHaveBeenCalledTimes(1);
  });
});

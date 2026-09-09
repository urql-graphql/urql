import { describe, it, expect } from 'vitest';
import { filter, makeSubject, merge, onEnd, pipe, subscribe } from 'wonka';
import type { Source } from 'wonka';

import { gql } from '../gql';
import { createClient } from '../client';
import type { Exchange, OperationResult } from '../types';
import { createRequest } from './request';
import { makeFragmentSource } from './fragmentSource';
import {
  getDeferredFieldPromise,
  makeDeferredState,
  updateDeferredResult,
} from './defer';
import type { MaskFragmentResult } from './maskFragment';

const collect = <Data>(source: Source<MaskFragmentResult<Data>>) => {
  const results: MaskFragmentResult<Data>[] = [];
  let completed = false;
  pipe(
    source,
    onEnd(() => {
      completed = true;
    }),
    subscribe(result => {
      results.push(result);
    })
  );
  return { results, completed: () => completed };
};

describe('makeFragmentSource', () => {
  const fragment = `fragment TodoFields on Todo { id name __typename }`;

  it('throws when the document contains no matching fragment', () => {
    expect(() =>
      makeFragmentSource({ fragment: `query { todo { id } }`, data: {} })
    ).toThrow(/did not contain a fragment definition/);
    expect(() =>
      makeFragmentSource({ fragment, data: {}, name: 'Other' })
    ).toThrow(/for "Other"/);
  });

  it('issues a fulfilled snapshot synchronously and completes', () => {
    const { results, completed } = collect(
      makeFragmentSource({
        fragment,
        data: { __typename: 'Todo', id: '1', name: 'Learn urql', extra: true },
      })
    );

    expect(completed()).toBe(true);
    expect(results).toHaveLength(1);
    expect(results[0].fulfilled).toBe(true);
    expect(results[0].data).toEqual({
      __typename: 'Todo',
      id: '1',
      name: 'Learn urql',
    });
  });

  it('passes through null and undefined data unchanged', () => {
    const seen: any[] = [];
    pipe(
      makeFragmentSource({ fragment, data: null }),
      subscribe(result => seen.push(result))
    );
    pipe(
      makeFragmentSource({ fragment, data: undefined }),
      subscribe(result => seen.push(result))
    );

    expect(seen).toEqual([
      { data: null, fulfilled: true },
      { data: undefined, fulfilled: true },
    ]);
  });

  it('selects a fragment by name', () => {
    const document = `
      fragment TodoIdentity on Todo { id __typename }
      fragment TodoDetails on Todo { name __typename }
    `;
    const seen: any[] = [];
    pipe(
      makeFragmentSource({
        fragment: document,
        name: 'TodoDetails',
        data: { __typename: 'Todo', id: '1', name: 'Learn urql' },
      }),
      subscribe(result => seen.push(result))
    );

    expect(seen[0].data).toEqual({ __typename: 'Todo', name: 'Learn urql' });
  });

  it('re-issues snapshots as deferred patches resolve', async () => {
    const query = gql`
      query {
        todo {
          id
          __typename
          ... on Todo @defer {
            name
          }
        }
      }
    `;

    const request = createRequest(query, {});
    const state = makeDeferredState();
    const data = { todo: { id: '1', __typename: 'Todo' } };

    // Simulate the first streamed result: `name` is still pending.
    updateDeferredResult(
      request,
      { operation: {} as any, data, stale: false, hasNext: true },
      state
    );

    const seen: MaskFragmentResult<any>[] = [];
    pipe(
      makeFragmentSource({
        fragment: `fragment TodoFields on Todo { name }`,
        data: data.todo,
      }),
      subscribe(result => seen.push(result))
    );

    expect(seen).toHaveLength(1);
    expect(seen[0].fulfilled).toBe(false);
    expect(seen[0].pending).toBeDefined();

    // The deferred patch arrives and resolves the sidecar promise.
    updateDeferredResult(
      request,
      {
        operation: {} as any,
        data: { todo: { id: '1', __typename: 'Todo', name: 'Hello' } },
        stale: false,
        hasNext: false,
      },
      state
    );
    await Promise.resolve();

    expect(seen).toHaveLength(2);
    expect(seen[1].fulfilled).toBe(true);
    expect(seen[1].data).toEqual({ name: 'Hello' });
  });

  it('completes without re-issuing when missing data has no pending patch', () => {
    const { results, completed } = collect(
      makeFragmentSource({
        fragment,
        data: { __typename: 'Todo', id: '1', name: undefined },
      })
    );

    expect(completed()).toBe(true);
    expect(results).toHaveLength(1);
    expect(results[0].fulfilled).toBe(false);
    expect(results[0].pending).toBeUndefined();
  });
});

describe('Client deferred tracking', () => {
  const query = gql`
    query {
      todo {
        id
        __typename
        ... on Todo @defer {
          name
        }
      }
    }
  `;

  const makeDeferClient = () => {
    const results = makeSubject<OperationResult>();
    const exchange: Exchange = () => ops$ =>
      merge([
        pipe(
          ops$,
          filter((): boolean => false)
        ) as any,
        results.source,
      ]);
    const client = createClient({
      url: 'http://0.0.0.0',
      exchanges: [exchange],
    });
    return { client, results };
  };

  it('associates and resolves sidecar promises on streamed query results', async () => {
    const { client, results } = makeDeferClient();
    const operation = client.createRequestOperation(
      'query',
      createRequest(query, undefined)
    );

    const seen: OperationResult[] = [];
    pipe(
      client.executeRequestOperation(operation),
      subscribe(result => seen.push(result))
    );

    const first = { todo: { id: '1', __typename: 'Todo' } };
    results.next({
      operation,
      data: first,
      stale: false,
      hasNext: true,
    });

    expect(seen).toHaveLength(1);
    const pending = getDeferredFieldPromise(first.todo, 'name')!;
    expect(pending).toBeDefined();
    expect(pending._resolved).toBe(false);

    results.next({
      operation,
      data: { todo: { id: '1', __typename: 'Todo', name: 'Hello' } },
      stale: false,
      hasNext: false,
    });

    expect(pending._resolved).toBe(true);
    expect(pending._value).toBe('Hello');
  });

  it('resolves pending promises when the operation is torn down', () => {
    const { client, results } = makeDeferClient();
    const operation = client.createRequestOperation(
      'query',
      createRequest(query, undefined)
    );

    const subscription = pipe(
      client.executeRequestOperation(operation),
      subscribe(() => {
        /*noop*/
      })
    );

    const first = { todo: { id: '1', __typename: 'Todo' } };
    results.next({
      operation,
      data: first,
      stale: false,
      hasNext: true,
    });

    const pending = getDeferredFieldPromise(first.todo, 'name')!;
    expect(pending._resolved).toBe(false);

    subscription.unsubscribe();

    expect(pending._resolved).toBe(true);
  });

  it('does not track results for queries without a stream', () => {
    const { client, results } = makeDeferClient();
    const operation = client.createRequestOperation(
      'query',
      createRequest(query, undefined)
    );

    pipe(
      client.executeRequestOperation(operation),
      subscribe(() => {
        /*noop*/
      })
    );

    const data = { todo: { id: '1', __typename: 'Todo' } };
    results.next({ operation, data, stale: false, hasNext: false });

    expect(getDeferredFieldPromise(data.todo, 'name')).toBeUndefined();
  });
});

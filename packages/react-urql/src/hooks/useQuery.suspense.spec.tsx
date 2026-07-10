// @vitest-environment jsdom

import React from 'react';
import { render, screen, act, cleanup } from '@testing-library/react';
import { vi, expect, it, describe, afterEach, beforeAll } from 'vitest';
import { pipe, subscribe, makeSubject } from 'wonka';

import {
  gql,
  Client,
  Exchange,
  Operation,
  OperationResult,
  createRequest,
  makeOperation,
} from '@urql/core';

import { Provider } from '../context';
import { getCacheForClient } from './cache';
import { useQuery } from './useQuery';

const query = gql`
  query Gifts {
    gifts
  }
`;

const requestKey = createRequest(query, undefined).key;

/** A client whose single exchange records operations and only responds when
 * the test pushes a result, so results can be timed around other events. */
function makeTestClient() {
  const operations: Operation[] = [];
  const results = makeSubject<OperationResult>();

  const responder: Exchange = () => ops$ => {
    pipe(
      ops$,
      subscribe(op => {
        operations.push(op);
      })
    );
    return results.source;
  };

  const client = new Client({
    url: 'http://localhost:3000/graphql',
    suspense: true,
    exchanges: [responder],
  });

  const respond = (data: any) => {
    const queries = operations.filter(op => op.kind === 'query');
    const operation = queries[queries.length - 1];
    if (!operation) throw new Error('No query operation was dispatched');
    results.next({
      operation,
      data,
      stale: false,
      hasNext: false,
    });
  };

  return { client, operations, respond };
}

let renders = 0;

const QueryGifts = () => {
  // Guard against the infinite render loop this suite demonstrates, so a
  // failure is a fast assertion error rather than a hanging test run
  if (++renders > 100) throw new Error('useQuery entered a render loop');

  const [state] = useQuery<{ gifts: string }>({ query });
  return <p>{state.data ? state.data.gifts : 'no data'}</p>;
};

describe('useQuery suspense cache recovery', () => {
  beforeAll(() => {
    vi.spyOn(globalThis.console, 'error').mockImplementation(() => {
      // do nothing
    });
  });

  afterEach(() => {
    cleanup();
    renders = 0;
  });

  // While a suspended query is in-flight, its suspense promise is only
  // resolved by the subscription `getSnapshot` opened on the operation's
  // result source. A `teardown` operation for the same key (another consumer
  // unmounting or re-executing, an exchange cancelling in-flight operations)
  // ends that source without a result: the promise then never resolves, stays
  // in the per-client suspense cache, and is re-thrown on every future
  // render. The component can never leave its Suspense fallback again — in an
  // app this freezes every navigation that re-renders the tree.
  it('recovers when the operation is torn down while suspended', async () => {
    const { client, operations, respond } = makeTestClient();

    render(
      <Provider value={client}>
        <React.Suspense fallback={<p>loading</p>}>
          <QueryGifts />
        </React.Suspense>
      </Provider>
    );

    expect(screen.getByText('loading')).toBeTruthy();
    const queryOps = () => operations.filter(op => op.kind === 'query');
    expect(queryOps().length).toBe(1);

    // The operation is torn down before its result arrives
    await act(async () => {
      client.reexecuteOperation(
        makeOperation('teardown', queryOps()[0], queryOps()[0].context)
      );
    });

    // The suspended consumer is still waiting: it must re-execute the query,
    // instead of hanging onto a promise that can no longer resolve
    expect(queryOps().length).toBe(2);

    await act(async () => {
      respond({ gifts: 'gifts' });
    });

    expect(screen.getByText('gifts')).toBeTruthy();
  });

  // If a suspense cache entry is (or becomes) a settled promise — e.g. after
  // the owning subscription died in a race between resolution and teardown —
  // `useQuery` re-throws that same promise on every render. React re-attaches
  // a ping listener to it each attempt, which fires immediately because the
  // promise is already settled: an unbounded, synchronous render loop that
  // freezes the tab (rendering hundreds of times per second with no commits).
  // Reading a settled thenable must instead be treated as a cache miss.
  it('does not loop rendering on a settled suspense cache entry', async () => {
    const { client, respond } = makeTestClient();

    getCacheForClient(client).set(
      requestKey,
      Promise.resolve({ data: { gifts: 'stale' } })
    );

    render(
      <Provider value={client}>
        <React.Suspense fallback={<p>loading</p>}>
          <QueryGifts />
        </React.Suspense>
      </Provider>
    );

    // Let the settled promise's microtasks (React's retry pings) flush
    await act(async () => {});

    expect(renders).toBeLessThan(50);

    await act(async () => {
      respond({ gifts: 'gifts' });
    });

    expect(screen.getByText('gifts')).toBeTruthy();
  });
});

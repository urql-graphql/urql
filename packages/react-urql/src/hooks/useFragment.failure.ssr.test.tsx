// @vitest-environment node

import { vi, expect, it, describe, beforeEach } from 'vitest';

vi.mock('../context', () => {
  const state = { current: {} };
  return {
    useClient: () => state.current,
    __setClient(client: unknown) {
      state.current = client as {};
    },
  };
});

import * as React from 'react';
import { Suspense } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { Writable } from 'stream';
import { filter, makeSubject, merge, pipe as wonkaPipe } from 'wonka';
import { createClient, createRequest, CombinedError } from '@urql/core';
import type { Exchange } from '@urql/core';

import { useQuery } from './useQuery';
import { useFragment } from './useFragment';
import * as context from '../context';

const setClient = (client: unknown) => (context as any).__setClient(client);

const makeStreamedClient = () => {
  const results = makeSubject<any>();
  const exchange: Exchange = () => ops$ =>
    merge([
      wonkaPipe(
        ops$,
        filter((): boolean => false)
      ) as any,
      results.source,
    ]);
  const client = createClient({
    url: 'http://0.0.0.0',
    suspense: true,
    exchanges: [exchange],
  });
  return { client, results };
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Resolves with the HTML, or with 'HANG' when the stream does not finish. */
const renderOrHang = (
  element: React.ReactElement,
  drive: () => Promise<void>,
  timeout = 500
): Promise<string> =>
  new Promise(resolve => {
    let html = '';
    const writable = new Writable({
      write(chunk, _e, cb) {
        html += chunk.toString();
        cb();
      },
    });
    writable.on('finish', () => resolve(html));
    const { pipe, abort } = renderToPipeableStream(element, {
      onShellReady() {
        pipe(writable);
      },
      onError() {},
    });
    sleep(10)
      .then(drive)
      .then(() => sleep(timeout))
      .then(() => {
        resolve('HANG');
        abort();
      });
  });

beforeEach(() => setClient({}));

const Deferred = ({ data, fragment }: { data: any; fragment: string }) => {
  const result = useFragment<any>({
    fragment,
    data,
    context: { suspense: true },
  });
  return <p>{JSON.stringify(result.data)}</p>;
};

describe('break-it: SSR', () => {
  it('H1: a failed deferred fragment errors the boundary instead of hanging', async () => {
    const { client, results } = makeStreamedClient();
    setClient(client);
    const query = `
      query { song { id __typename ...SongFields @defer } }
      fragment SongFields on Song { title }
    `;
    const operation = client.createRequestOperation(
      'query',
      createRequest(query, undefined)
    );

    const Page = () => {
      const [result] = useQuery<any>({ query, context: { suspense: true } });
      return (
        <Suspense fallback={<p>loading</p>}>
          <Deferred
            data={result.data.song}
            fragment="fragment SongFields on Song { title }"
          />
        </Suspense>
      );
    };

    const html = await renderOrHang(<Page />, async () => {
      results.next({
        operation,
        data: { song: { __typename: 'Song', id: '1' } },
        hasNext: true,
        stale: false,
      });
      await sleep(20);
      // The deferred fragment errored: spec-compliant servers send errors and
      // no data for the deferred path, then end the stream.
      results.next({
        operation,
        data: { song: { __typename: 'Song', id: '1' } },
        error: new CombinedError({
          graphQLErrors: [{ message: 'boom', path: ['song', 'title'] } as any],
        }),
        hasNext: false,
        stale: false,
      });
    });

    expect(html).not.toBe('HANG');
    expect(html).toContain('$!');
  });

  it('H6: a deferred spread on an interface type streams', async () => {
    const { client, results } = makeStreamedClient();
    setClient(client);
    const query = `
      query { node { id __typename ...NodeFields @defer } }
      fragment NodeFields on Node { createdAt }
    `;
    const operation = client.createRequestOperation(
      'query',
      createRequest(query, undefined)
    );

    const Page = () => {
      const [result] = useQuery<any>({ query, context: { suspense: true } });
      return (
        <Suspense fallback={<p>loading</p>}>
          <Deferred
            data={result.data.node}
            fragment="fragment NodeFields on Node { createdAt }"
          />
        </Suspense>
      );
    };

    const html = await renderOrHang(<Page />, async () => {
      results.next({
        operation,
        data: { node: { __typename: 'Todo', id: '1' } },
        hasNext: true,
        stale: false,
      });
      await sleep(20);
      results.next({
        operation,
        data: { node: { __typename: 'Todo', id: '1', createdAt: 'yesterday' } },
        hasNext: false,
        stale: false,
      });
    });

    expect(html).toContain('$RC');
    expect(html).toContain('yesterday');
  });

  it('control: same shape on a concrete type streams fine', async () => {
    const { client, results } = makeStreamedClient();
    setClient(client);
    const query = `
      query { node { id __typename ...NodeFields @defer } }
      fragment NodeFields on Todo { createdAt }
    `;
    const operation = client.createRequestOperation(
      'query',
      createRequest(query, undefined)
    );
    const Page = () => {
      const [result] = useQuery<any>({ query, context: { suspense: true } });
      return (
        <Suspense fallback={<p>loading</p>}>
          <Deferred
            data={result.data.node}
            fragment="fragment NodeFields on Todo { createdAt }"
          />
        </Suspense>
      );
    };
    const html = await renderOrHang(<Page />, async () => {
      results.next({
        operation,
        data: { node: { __typename: 'Todo', id: '1' } },
        hasNext: true,
        stale: false,
      });
      await sleep(20);
      results.next({
        operation,
        data: { node: { __typename: 'Todo', id: '1', createdAt: 'yesterday' } },
        hasNext: false,
        stale: false,
      });
    });
    expect(html).toContain('$RC');
    expect(html).toContain('yesterday');
  });
});

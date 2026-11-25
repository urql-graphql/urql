// @vitest-environment jsdom

import { vi, expect, it, describe, beforeEach, afterEach } from 'vitest';

vi.mock('../context', () => {
  const state = { current: {} };
  return {
    useClient: () => state.current,
    __setClient(client: unknown) {
      state.current = client as {};
    },
  };
});

import React, { Suspense } from 'react';
import { render, act, cleanup } from '@testing-library/react';
import { filter, makeSubject, merge, pipe } from 'wonka';
import {
  createClient,
  createRequest,
  CombinedError,
  makeResult,
  mergeResultPatch,
} from '@urql/core';
import type { Exchange } from '@urql/core';

import { useFragment } from './useFragment';
import { useQuery } from './useQuery';
import * as context from '../context';

const setClient = (client: unknown) => (context as any).__setClient(client);

const makeStreamedClient = (suspense = true) => {
  const results = makeSubject<any>();
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
    suspense,
    exchanges: [exchange],
  });
  return { client, results };
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

class Boundary extends React.Component<
  { children: React.ReactNode; onError?: (e: unknown) => void },
  { error?: unknown }
> {
  state: { error?: unknown } = {};
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  componentDidCatch(error: unknown) {
    this.props.onError?.(error);
  }
  render() {
    return this.state.error ? <b>error</b> : this.props.children;
  }
}

const songQuery = `
  query { song { id __typename ...SongFields @defer } }
  fragment SongFields on Song { title }
`;
const SongFields = 'fragment SongFields on Song { title }';

/** Renders the first `song` reference it sees and never re-renders the child. */
const FrozenParent = ({ children }: { children: (ref: any) => any }) => {
  const [result] = useQuery<any>({ query: songQuery });
  const ref = React.useRef<any>(null);
  if (!ref.current && result.data) ref.current = result.data.song;
  return ref.current ? children(ref.current) : null;
};

beforeEach(() => setClient({}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useFragment', () => {
  it('returns the reference itself when complete', () => {
    setClient(makeStreamedClient(false).client);
    const ref = { __typename: 'Song', id: '1', title: 'Hello' };
    let out: any;
    const C = () => {
      out = useFragment<any>({ fragment: SongFields, data: ref });
      return null;
    };
    const { rerender } = render(<C />);
    const first = out;
    rerender(<C />);
    expect(out.data).toBe(ref);
    expect(out).toBe(first);
  });

  it('suspends on a deferred spread and resolves from the stream without a parent rerender', async () => {
    const { client, results } = makeStreamedClient(true);
    setClient(client);
    const operation = client.createRequestOperation(
      'query',
      createRequest(songQuery, undefined)
    );
    const Song = ({ data }: any) => (
      <p>{useFragment<any>({ fragment: SongFields, data }).data.title}</p>
    );

    const { container } = render(
      <Suspense fallback={<i>page</i>}>
        <FrozenParent>
          {ref => (
            <Suspense fallback={<i>song</i>}>
              <Song data={ref} />
            </Suspense>
          )}
        </FrozenParent>
      </Suspense>
    );

    const first = makeResult(operation, {
      data: { song: { __typename: 'Song', id: '1' } },
      hasNext: true,
    });
    await act(async () => {
      results.next(first);
      await sleep(10);
    });
    expect(container.innerHTML).toBe('<i>song</i>');

    await act(async () => {
      results.next(
        mergeResultPatch(first, {
          incremental: [{ path: ['song'], data: { title: 'Hello' } }],
          hasNext: false,
        })
      );
      await sleep(10);
    });
    expect(container.innerHTML).toBe('<p>Hello</p>');
  });

  it('reports fetching without Suspense and updates without a parent rerender', async () => {
    const { client, results } = makeStreamedClient(false);
    setClient(client);
    const operation = client.createRequestOperation(
      'query',
      createRequest(songQuery, undefined)
    );
    const seen: any[] = [];
    const Song = ({ data }: any) => {
      seen.push(useFragment<any>({ fragment: SongFields, data }));
      return null;
    };
    render(<FrozenParent>{ref => <Song data={ref} />}</FrozenParent>);

    const first = makeResult(operation, {
      data: { song: { __typename: 'Song', id: '1' } },
      hasNext: true,
    });
    await act(async () => {
      results.next(first);
      await sleep(10);
    });
    expect(seen[seen.length - 1]).toEqual({ fetching: true, data: undefined });

    await act(async () => {
      results.next(
        mergeResultPatch(first, {
          incremental: [{ path: ['song'], data: { title: 'Hello' } }],
          hasNext: false,
        })
      );
      await sleep(10);
    });
    expect(seen[seen.length - 1]).toMatchObject({
      fetching: false,
      data: { title: 'Hello' },
    });
  });

  it('resolves list siblings independently', async () => {
    const { client, results } = makeStreamedClient(true);
    setClient(client);
    const query = `
      query { songs { id __typename ...SongFields @defer } }
      fragment SongFields on Song { title }
    `;
    const operation = client.createRequestOperation(
      'query',
      createRequest(query, undefined)
    );
    const Song = ({ data }: any) => (
      <p>{useFragment<any>({ fragment: SongFields, data }).data.title}</p>
    );
    const Page = () => {
      const [result] = useQuery<any>({ query });
      const refs = React.useRef<any[]>();
      if (!refs.current) refs.current = result.data.songs;
      return refs.current!.map((song: any) => (
        <Suspense key={song.id} fallback={<i>{song.id}</i>}>
          <Song data={song} />
        </Suspense>
      ));
    };
    const { container } = render(
      <Suspense fallback={<i>page</i>}>
        <Page />
      </Suspense>
    );

    const first = makeResult(operation, {
      data: {
        songs: [
          { __typename: 'Song', id: '1' },
          { __typename: 'Song', id: '2' },
        ],
      },
      hasNext: true,
    });
    await act(async () => {
      results.next(first);
      await sleep(10);
    });
    await act(async () => {
      results.next(
        mergeResultPatch(first, {
          incremental: [{ path: ['songs', 1], data: { title: 'Second' } }],
          hasNext: true,
        })
      );
      await sleep(10);
    });
    expect(container.innerHTML).toBe('<i>1</i><p>Second</p>');
  });

  it('streams a spread on an interface type condition', async () => {
    const { client, results } = makeStreamedClient(true);
    setClient(client);
    const query = `
      query { node { id __typename ...NodeFields @defer } }
      fragment NodeFields on Node { createdAt }
    `;
    const operation = client.createRequestOperation(
      'query',
      createRequest(query, undefined)
    );
    const Node = ({ data }: any) => (
      <p>
        {
          useFragment<any>({
            fragment: 'fragment NodeFields on Node { createdAt }',
            data,
          }).data.createdAt
        }
      </p>
    );
    const Page = () => {
      const [result] = useQuery<any>({ query });
      const ref = React.useRef<any>();
      if (!ref.current) ref.current = result.data.node;
      return (
        <Suspense fallback={<i>node</i>}>
          <Node data={ref.current} />
        </Suspense>
      );
    };
    const { container } = render(
      <Suspense fallback={<i>page</i>}>
        <Page />
      </Suspense>
    );
    const first = makeResult(operation, {
      data: { node: { __typename: 'Todo', id: '1' } },
      hasNext: true,
    });
    await act(async () => {
      results.next(first);
      await sleep(10);
    });
    expect(container.innerHTML).toBe('<i>node</i>');
    await act(async () => {
      results.next(
        mergeResultPatch(first, {
          incremental: [{ path: ['node'], data: { createdAt: 'yesterday' } }],
          hasNext: false,
        })
      );
      await sleep(10);
    });
    expect(container.innerHTML).toBe('<p>yesterday</p>');
  });

  it('throws the scoped GraphQL error when a deferred fragment fails', async () => {
    const { client, results } = makeStreamedClient(true);
    setClient(client);
    const operation = client.createRequestOperation(
      'query',
      createRequest(songQuery, undefined)
    );
    const caught: any[] = [];
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const Song = ({ data }: any) => (
      <p>{useFragment<any>({ fragment: SongFields, data }).data.title}</p>
    );
    const { container } = render(
      <Suspense fallback={<i>page</i>}>
        <FrozenParent>
          {ref => (
            <Boundary onError={e => caught.push(e)}>
              <Suspense fallback={<i>song</i>}>
                <Song data={ref} />
              </Suspense>
            </Boundary>
          )}
        </FrozenParent>
      </Suspense>
    );
    const first = makeResult(operation, {
      data: { song: { __typename: 'Song', id: '1' } },
      hasNext: true,
    });
    await act(async () => {
      results.next(first);
      await sleep(10);
    });
    await act(async () => {
      results.next(
        mergeResultPatch(first, {
          incremental: [
            {
              path: ['song'],
              data: null,
              errors: [{ message: 'boom', path: ['song', 'title'] }],
            },
          ],
          hasNext: false,
        } as any)
      );
      await sleep(10);
    });
    expect(container.innerHTML).toBe('<b>error</b>');
    expect(caught[0]).toBeInstanceOf(CombinedError);
    expect(caught[0].graphQLErrors[0].message).toBe('boom');
  });

  it('reports the scoped error without Suspense', async () => {
    const { client, results } = makeStreamedClient(false);
    setClient(client);
    const operation = client.createRequestOperation(
      'query',
      createRequest(songQuery, undefined)
    );
    const seen: any[] = [];
    const Song = ({ data }: any) => {
      seen.push(useFragment<any>({ fragment: SongFields, data }));
      return null;
    };
    render(<FrozenParent>{ref => <Song data={ref} />}</FrozenParent>);
    const first = makeResult(operation, {
      data: { song: { __typename: 'Song', id: '1' } },
      hasNext: true,
    });
    await act(async () => {
      results.next(first);
      await sleep(10);
      results.next(
        mergeResultPatch(first, {
          incremental: [
            {
              path: ['song'],
              data: null,
              errors: [{ message: 'boom', path: ['song', 'title'] }],
            },
          ],
          hasNext: false,
        } as any)
      );
      await sleep(10);
    });
    const last = seen[seen.length - 1];
    expect(last.fetching).toBe(false);
    expect(last.data).toBeUndefined();
    expect(last.error.graphQLErrors[0].message).toBe('boom');
  });

  it('never suspends on incomplete data no stream will deliver, and warns', async () => {
    setClient(makeStreamedClient(true).client);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const Card = ({ song }: any) => (
      <p>
        {String(
          useFragment<any>({
            fragment: 'fragment S on Song { id title }',
            data: song,
          }).data.title
        )}
      </p>
    );
    const { container } = render(
      <Suspense fallback={<i>fallback</i>}>
        <Card song={{ __typename: 'Song', id: '1' }} />
      </Suspense>
    );
    await act(() => sleep(10));
    expect(container.innerHTML).toBe('<p>undefined</p>');
    expect(warn.mock.calls[0][0]).toContain('missing "title"');
  });

  it('does not re-suspend for an entity it has already shown when a refetch streams', async () => {
    const { client, results } = makeStreamedClient(true);
    setClient(client);
    const operation = client.createRequestOperation(
      'query',
      createRequest(songQuery, undefined)
    );
    const Song = ({ data }: any) => {
      const r = useFragment<any>({ fragment: SongFields, data });
      return <p>{r.data.title + (r.fetching ? '…' : '')}</p>;
    };
    const Page = () => {
      const [result] = useQuery<any>({ query: songQuery });
      return (
        <Suspense fallback={<i>song</i>}>
          <Song data={result.data.song} />
        </Suspense>
      );
    };
    const { container } = render(
      <Suspense fallback={<i>page</i>}>
        <Page />
      </Suspense>
    );
    await act(async () => {
      results.next(
        makeResult(operation, {
          data: { song: { __typename: 'Song', id: '1', title: 'Old' } },
          hasNext: false,
        })
      );
      await sleep(10);
    });
    expect(container.innerHTML).toBe('<p>Old</p>');

    const refetch = makeResult(operation, {
      data: { song: { __typename: 'Song', id: '1' } },
      hasNext: true,
    });
    await act(async () => {
      results.next(refetch);
      await sleep(10);
    });
    expect(container.innerHTML).toBe('<p>Old…</p>');

    await act(async () => {
      results.next(
        mergeResultPatch(refetch, {
          incremental: [{ path: ['song'], data: { title: 'New' } }],
          hasNext: false,
        })
      );
      await sleep(10);
    });
    expect(container.innerHTML).toBe('<p>New</p>');
  });

  it('does not track streamed queries without @defer', async () => {
    const { client, results } = makeStreamedClient(false);
    setClient(client);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const query = `query { song { id __typename } }`;
    const operation = client.createRequestOperation(
      'query',
      createRequest(query, undefined)
    );
    const seen: any[] = [];
    const Song = ({ data }: any) => {
      seen.push(useFragment<any>({ fragment: SongFields, data }));
      return null;
    };
    const Page = () => {
      const [result] = useQuery<any>({ query });
      return result.data ? <Song data={result.data.song} /> : null;
    };
    render(<Page />);
    await act(async () => {
      results.next(
        makeResult(operation, {
          data: { song: { __typename: 'Song', id: '1' } },
          hasNext: true,
        })
      );
      await sleep(10);
    });
    // No owner was recorded, so the incomplete reference is returned as-is
    // instead of waiting on a stream that will never deliver `title`.
    expect(seen[seen.length - 1]).toMatchObject({
      fetching: false,
      data: { id: '1' },
    });
  });
});

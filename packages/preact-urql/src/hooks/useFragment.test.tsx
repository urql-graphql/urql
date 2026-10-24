// @vitest-environment jsdom

import { Component, h } from 'preact';
import type { ComponentChildren } from 'preact';
import { Suspense } from 'preact/compat';
import { useRef } from 'preact/hooks';
import { render, act, cleanup } from '@testing-library/preact';
import { vi, expect, it, describe, afterEach } from 'vitest';
import { filter, makeSubject, merge, pipe } from 'wonka';
import {
  createClient,
  createRequest,
  CombinedError,
  makeResult,
  mergeResultPatch,
} from '@urql/core';
import type { Client, Exchange } from '@urql/core';

import { useFragment } from './useFragment';
import { useQuery } from './useQuery';
import { Provider } from '../context';

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

const renderWith = (client: Client, children: ComponentChildren) =>
  render(h(Provider, { value: client, children }));

class Boundary extends Component<
  { onError?: (e: unknown) => void },
  { error?: unknown }
> {
  state: { error?: unknown } = {};
  componentDidCatch(error: unknown) {
    this.props.onError?.(error);
    this.setState({ error });
  }
  render() {
    return this.state.error ? h('b', {}, 'error') : this.props.children;
  }
}

const songQuery = `
  query { song { id __typename ...SongFields @defer } }
  fragment SongFields on Song { title }
`;
const SongFields = 'fragment SongFields on Song { title }';

/** Renders the first `song` reference it sees and never re-renders the child. */
const FrozenParent = ({ render }: { render: (ref: any) => any }) => {
  const [result] = useQuery<any>({ query: songQuery });
  const ref = useRef<any>(null);
  if (!ref.current && result.data) ref.current = result.data.song;
  return ref.current ? render(ref.current) : null;
};

const Song = ({ data }: any) =>
  h('p', {}, useFragment<any>({ fragment: SongFields, data }).data.title);

const failedPatch = (first: any) =>
  mergeResultPatch(first, {
    incremental: [
      {
        path: ['song'],
        data: null,
        errors: [{ message: 'boom', path: ['song', 'title'] }],
      },
    ],
    hasNext: false,
  } as any);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useFragment', () => {
  it('returns the reference itself when complete', () => {
    const { client } = makeStreamedClient(false);
    const ref = { __typename: 'Song', id: '1', title: 'Hello' };
    let out: any;
    const C = () => {
      out = useFragment<any>({ fragment: SongFields, data: ref });
      return null;
    };
    const { rerender } = renderWith(client, h(C, {}));
    const first = out;
    rerender(h(Provider, { value: client, children: h(C, {}) }));
    expect(out.data).toBe(ref);
    expect(out).toBe(first);
  });

  it('suspends on a deferred spread and resolves from the stream without a parent rerender', async () => {
    const { client, results } = makeStreamedClient(true);
    const operation = client.createRequestOperation(
      'query',
      createRequest(songQuery, undefined)
    );
    const { container } = renderWith(
      client,
      h(
        Suspense,
        { fallback: h('i', {}, 'page') },
        h(FrozenParent, {
          render: ref =>
            h(
              Suspense,
              { fallback: h('i', {}, 'song') },
              h(Song, { data: ref })
            ),
        })
      )
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
    const operation = client.createRequestOperation(
      'query',
      createRequest(songQuery, undefined)
    );
    const seen: any[] = [];
    const Probe = ({ data }: any) => {
      seen.push(useFragment<any>({ fragment: SongFields, data }));
      return null;
    };
    renderWith(
      client,
      h(FrozenParent, { render: ref => h(Probe, { data: ref }) })
    );

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

  it('streams a spread on an interface type condition', async () => {
    const { client, results } = makeStreamedClient(true);
    const query = `
      query { node { id __typename ...NodeFields @defer } }
      fragment NodeFields on Node { createdAt }
    `;
    const operation = client.createRequestOperation(
      'query',
      createRequest(query, undefined)
    );
    const Node = ({ data }: any) =>
      h(
        'p',
        {},
        useFragment<any>({
          fragment: 'fragment NodeFields on Node { createdAt }',
          data,
        }).data.createdAt
      );
    const Page = () => {
      const [result] = useQuery<any>({ query });
      const ref = useRef<any>(null);
      if (!ref.current) ref.current = result.data.node;
      return h(
        Suspense,
        { fallback: h('i', {}, 'node') },
        h(Node, { data: ref.current })
      );
    };
    const { container } = renderWith(
      client,
      h(Suspense, { fallback: h('i', {}, 'page') }, h(Page, {}))
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
    const operation = client.createRequestOperation(
      'query',
      createRequest(songQuery, undefined)
    );
    const caught: any[] = [];
    const { container } = renderWith(
      client,
      h(
        Suspense,
        { fallback: h('i', {}, 'page') },
        h(FrozenParent, {
          render: ref =>
            h(
              Boundary,
              { onError: e => caught.push(e) },
              h(
                Suspense,
                { fallback: h('i', {}, 'song') },
                h(Song, { data: ref })
              )
            ),
        })
      )
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
      results.next(failedPatch(first));
      await sleep(10);
    });
    expect(container.innerHTML).toBe('<b>error</b>');
    expect(caught[0]).toBeInstanceOf(CombinedError);
    expect(caught[0].graphQLErrors[0].message).toBe('boom');
  });

  it('reports the scoped error without Suspense', async () => {
    const { client, results } = makeStreamedClient(false);
    const operation = client.createRequestOperation(
      'query',
      createRequest(songQuery, undefined)
    );
    const seen: any[] = [];
    const Probe = ({ data }: any) => {
      seen.push(useFragment<any>({ fragment: SongFields, data }));
      return null;
    };
    renderWith(
      client,
      h(FrozenParent, { render: ref => h(Probe, { data: ref }) })
    );

    const first = makeResult(operation, {
      data: { song: { __typename: 'Song', id: '1' } },
      hasNext: true,
    });
    await act(async () => {
      results.next(first);
      await sleep(10);
      results.next(failedPatch(first));
      await sleep(10);
    });
    const last = seen[seen.length - 1];
    expect(last.fetching).toBe(false);
    expect(last.data).toBeUndefined();
    expect(last.error.graphQLErrors[0].message).toBe('boom');
  });

  it('never suspends on incomplete data no stream will deliver, and warns', async () => {
    const { client } = makeStreamedClient(true);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const Card = ({ song }: any) =>
      h(
        'p',
        {},
        String(
          useFragment<any>({
            fragment: 'fragment S on Song { id title }',
            data: song,
          }).data.title
        )
      );
    const { container } = renderWith(
      client,
      h(
        Suspense,
        { fallback: h('i', {}, 'fallback') },
        h(Card, { song: { __typename: 'Song', id: '1' } })
      )
    );
    await act(async () => {
      await sleep(10);
    });
    expect(container.innerHTML).toBe('<p>undefined</p>');
    expect(warn.mock.calls[0][0]).toContain('missing "title"');
  });

  it('does not re-suspend for an entity it has already shown when a refetch streams', async () => {
    const { client, results } = makeStreamedClient(true);
    const operation = client.createRequestOperation(
      'query',
      createRequest(songQuery, undefined)
    );
    const Title = ({ data }: any) => {
      const r = useFragment<any>({ fragment: SongFields, data });
      return h('p', {}, r.data.title + (r.fetching ? '…' : ''));
    };
    const Page = () => {
      const [result] = useQuery<any>({ query: songQuery });
      return h(
        Suspense,
        { fallback: h('i', {}, 'song') },
        h(Title, { data: result.data.song })
      );
    };
    const { container } = renderWith(
      client,
      h(Suspense, { fallback: h('i', {}, 'page') }, h(Page, {}))
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
});

// @vitest-environment node

import { vi, expect, it, describe, beforeEach } from 'vitest';

vi.mock('../context', () => {
  const mock = {};

  return {
    useClient: () => mock,
  };
});

import * as React from 'react';
import { Suspense } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { Writable } from 'stream';
import { makeSubject } from 'wonka';

import { useQuery } from './useQuery';
import { useFragment } from './useFragment';
import { useClient } from '../context';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Render `element` to a string via React's streaming server renderer.
 *
 * @remarks
 * `drive` is invoked after rendering starts so the test can push results into
 * the mocked query stream. The promise resolves with the fully streamed HTML,
 * i.e. after every Suspense boundary has resolved.
 */
const renderToString = (
  element: React.ReactElement,
  drive: () => void | Promise<void>
): Promise<string> =>
  new Promise((resolve, reject) => {
    let html = '';
    const writable = new Writable({
      write(chunk, _encoding, callback) {
        html += chunk.toString();
        callback();
      },
    });
    writable.on('finish', () => resolve(html));

    const { pipe } = renderToPipeableStream(element, {
      onShellReady() {
        pipe(writable);
      },
      onError(error) {
        reject(error);
      },
    });

    Promise.resolve().then(drive).catch(reject);
  });

beforeEach(() => {
  const client = useClient() as any;
  delete client._deferred;
  delete client._fragments;
  delete client._react;
  delete client.executeQuery;
  delete client.suspense;
});

describe('useFragment SSR streaming', () => {
  // This is the layout that the client-only mechanism couldn't satisfy: the
  // Suspense boundary sits *below* `useQuery` and `useFragment` lives in a
  // child. On the server `Page` never re-renders, so the deferred fragment can
  // only resolve by reading the value off the stream-owned promise directly.
  it('streams a deferred fragment whose boundary is below useQuery', async () => {
    const client = useClient() as any;
    const subject = makeSubject<any>();
    client.executeQuery = vi.fn(() => subject.source);

    const Deferred = ({ data }: { data: any }) => {
      const fragment = useFragment<any>({
        query: `fragment SongFields on Song { title }`,
        data,
        context: { suspense: true },
      });
      return <p>{fragment.data.title}</p>;
    };

    const Page = () => {
      const [result] = useQuery<any>({
        query: `
          query {
            song {
              id
              __typename
              ...SongFields @defer
            }
          }

          fragment SongFields on Song {
            title
          }
        `,
        context: { suspense: true },
      });

      return (
        <main>
          <span>{result.data.song.__typename}</span>
          <Suspense fallback={<p>loading</p>}>
            <Deferred data={result.data.song} />
          </Suspense>
        </main>
      );
    };

    const html = await renderToString(<Page />, async () => {
      // Initial payload: non-deferred fields only, `title` is still pending.
      subject.next({
        data: { song: { __typename: 'Song', id: '1' } },
        hasNext: true,
        stale: false,
      });

      // Let React render the shell with the boundary's fallback before the
      // deferred patch arrives, so the child genuinely suspends.
      await sleep(20);

      // The deferred patch streams in; the query stream resolves the promise.
      subject.next({
        data: { song: { __typename: 'Song', id: '1', title: 'Hello' } },
        hasNext: false,
        stale: false,
      });
    });

    // The non-deferred field is in the shell, and the deferred fragment was
    // streamed in and resolved server-side — without any parent rerender.
    expect(html).toContain('Song');
    expect(html).toContain('Hello');
  });

  it('streams a nested deferred fragment', async () => {
    const client = useClient() as any;
    const subject = makeSubject<any>();
    client.executeQuery = vi.fn(() => subject.source);

    const Author = ({ data }: { data: any }) => {
      const fragment = useFragment<any>({
        query: `fragment AuthorFields on Author { name }`,
        data,
        context: { suspense: true },
      });
      return <span>{fragment.data.name}</span>;
    };

    const Page = () => {
      const [result] = useQuery<any>({
        query: `
          query {
            post {
              id
              __typename
              ...PostFields @defer
            }
          }

          fragment PostFields on Post {
            author {
              __typename
              ...AuthorFields @defer
            }
          }

          fragment AuthorFields on Author {
            name
          }
        `,
        context: { suspense: true },
      });

      const post = result.data.post;
      return (
        <Suspense fallback={<p>loading-post</p>}>
          <PostBody post={post} />
        </Suspense>
      );
    };

    const PostBody = ({ post }: { post: any }) => {
      const fragment = useFragment<any>({
        query: `
          fragment PostFields on Post {
            author {
              __typename
              ...AuthorFields @defer
            }
          }

          fragment AuthorFields on Author {
            name
          }
        `,
        data: post,
        context: { suspense: true },
      });
      return (
        <Suspense fallback={<p>loading-author</p>}>
          <Author data={fragment.data.author} />
        </Suspense>
      );
    };

    const html = await renderToString(<Page />, async () => {
      subject.next({
        data: { post: { __typename: 'Post', id: '1' } },
        hasNext: true,
        stale: false,
      });
      await sleep(20);
      subject.next({
        data: {
          post: {
            __typename: 'Post',
            id: '1',
            author: { __typename: 'Author' },
          },
        },
        hasNext: true,
        stale: false,
      });
      await sleep(20);
      subject.next({
        data: {
          post: {
            __typename: 'Post',
            id: '1',
            author: { __typename: 'Author', name: 'Jovi' },
          },
        },
        hasNext: false,
        stale: false,
      });
    });

    expect(html).toContain('Jovi');
  });
});

// @vitest-environment jsdom

import { vi, expect, it, describe, beforeEach } from 'vitest';

vi.mock('../context', () => {
  const mock = {};

  return {
    useClient: () => mock,
  };
});

import React, { Suspense } from 'react';
import { renderHook, render, act, cleanup } from '@testing-library/react';
import { makeSubject } from 'wonka';
import { createRequest } from '@urql/core';
import type { TypedDocumentNode } from '@urql/core';

import { getFragmentPromise } from './cache';
import { useFragment } from './useFragment';
import type { UseFragmentState } from './useFragment';
import { useQuery } from './useQuery';
import { useClient } from '../context';

const mockQuery = `
  fragment TodoFields on Todo {
    id
    name
    __typename
  }
`;

type FilmData = { __typename: 'Film'; id: string; title: string };
declare const tadaFragmentRefs: unique symbol;
type TadaFragmentOf = {
  readonly [tadaFragmentRefs]: { FilmItem: 'Film' };
};
type Incremental<Data> =
  | Data
  | { [Key in keyof Data]?: Key extends '__typename' ? Data[Key] : never };
type CodegenFragmentType<Data> = {
  ' $fragmentRefs'?: { FilmItemFragment: Data };
};

// Compile-time coverage for gql.tada's opaque FragmentOf shape and GraphQL
// Code Generator's incremental FragmentType shape. The fragment document alone
// determines the returned data type; the masked input has its own generic.
const useCheckFragmentReferenceInterop = (
  tadaFragment: TypedDocumentNode<FilmData, never>,
  codegenFragment: TypedDocumentNode<FilmData, unknown>,
  tada: TadaFragmentOf | null | undefined,
  codegen:
    | CodegenFragmentType<Incremental<FilmData>>
    | Record<PropertyKey, never>
) => {
  const tadaResult: UseFragmentState<FilmData> = useFragment({
    fragment: tadaFragment,
    data: tada,
  });
  const codegenResult: UseFragmentState<FilmData> = useFragment({
    fragment: codegenFragment,
    data: codegen,
  });
  return [tadaResult, codegenResult];
};
void useCheckFragmentReferenceInterop;

beforeEach(() => {
  cleanup();
  const client = useClient() as any;
  // Reset the per-client suspense caches between tests.
  delete client._deferred;
  delete client._fragments;
  delete client._react;
  delete client.executeQuery;
  delete client.suspense;
});

describe('useFragment masking', () => {
  it('should correctly mask data', () => {
    const { result } = renderHook(
      ({ fragment }) =>
        useFragment({
          fragment,
          data: {
            __typename: 'Todo',
            id: '1',
            name: 'Learn urql',
            completed: true,
          },
        }),
      { initialProps: { fragment: mockQuery } }
    );

    expect(result.current).toEqual({
      fetching: false,
      data: {
        __typename: 'Todo',
        id: '1',
        name: 'Learn urql',
      },
    });
  });

  it('should correctly take a named fragment to mask data', () => {
    const { result } = renderHook(() =>
      useFragment({
        fragment: `fragment x on X { foo bar } fragment TodoFields on Todo { id name __typename }`,
        name: 'TodoFields',
        data: {
          __typename: 'Todo',
          id: '1',
          name: 'Learn urql',
          completed: true,
        },
      })
    );

    expect(result.current).toEqual({
      fetching: false,
      data: {
        __typename: 'Todo',
        id: '1',
        name: 'Learn urql',
      },
    });
  });

  it('updates the masked data when the fragment name changes', () => {
    const query = `
      fragment TodoIdentity on Todo { id __typename }
      fragment TodoDetails on Todo { name __typename }
    `;
    const data = {
      __typename: 'Todo',
      id: '1',
      name: 'Learn urql',
    };

    const { result, rerender } = renderHook(
      ({ name }) => useFragment({ fragment: query, name, data }),
      { initialProps: { name: 'TodoIdentity' } }
    );

    expect(result.current).toEqual({
      fetching: false,
      data: { __typename: 'Todo', id: '1' },
    });

    rerender({ name: 'TodoDetails' });

    expect(result.current).toEqual({
      fetching: false,
      data: { __typename: 'Todo', name: 'Learn urql' },
    });
  });

  it('should correctly mask data w/ null attribute', () => {
    const { result } = renderHook(() =>
      useFragment({
        fragment: mockQuery,
        data: { __typename: 'Todo', id: '1', name: null, completed: true },
      })
    );

    expect(result.current).toEqual({
      fetching: false,
      data: {
        __typename: 'Todo',
        id: '1',
        name: null,
      },
    });
  });

  it('should correctly indicate loading w/ undefined attribute', () => {
    const { result } = renderHook(() =>
      useFragment({
        fragment: mockQuery,
        data: {
          __typename: 'Todo',
          id: '1',
          name: undefined,
          completed: true,
        },
      })
    );

    expect(result.current).toEqual({
      fetching: true,
      data: {
        __typename: 'Todo',
        id: '1',
      },
    });
  });

  it('should correctly mask data w/ nested object', () => {
    const { result } = renderHook(() =>
      useFragment({
        fragment: `
          fragment TodoFields on Todo {
            id
            name
            __typename
            author { id name __typename }
          }`,
        data: {
          __typename: 'Todo',
          id: '1',
          name: null,
          completed: true,
          author: {
            id: '1',
            name: 'Jovi',
            __typename: 'Author',
            awardWinner: true,
          },
        },
      })
    );

    expect(result.current).toEqual({
      fetching: false,
      data: {
        __typename: 'Todo',
        id: '1',
        name: null,
        author: {
          __typename: 'Author',
          id: '1',
          name: 'Jovi',
        },
      },
    });
  });

  it('should correctly mask data w/ nested selection that is null', () => {
    const { result } = renderHook(() =>
      useFragment({
        fragment: `
          fragment TodoFields on Todo {
            id
            name
            __typename
            author { id name __typename }
          }`,
        data: {
          __typename: 'Todo',
          id: '1',
          name: null,
          completed: true,
          author: null,
        },
      })
    );

    expect(result.current).toEqual({
      fetching: false,
      data: {
        __typename: 'Todo',
        id: '1',
        name: null,
        author: null,
      },
    });
  });

  it('should preserve null items in nullable lists', () => {
    const { result } = renderHook(() =>
      useFragment({
        fragment: `
          fragment TodoFields on Todo {
            id
            __typename
            assignees { id name __typename }
          }`,
        data: {
          __typename: 'Todo',
          id: '1',
          assignees: [
            null,
            {
              __typename: 'User',
              id: '2',
              name: 'Jovi',
              role: 'admin',
            },
          ],
        },
      })
    );

    expect(result.current).toEqual({
      fetching: false,
      data: {
        __typename: 'Todo',
        id: '1',
        assignees: [
          null,
          {
            __typename: 'User',
            id: '2',
            name: 'Jovi',
          },
        ],
      },
    });
  });

  it('should correctly mark loading w/ nested selection that is undefined', () => {
    const { result } = renderHook(() =>
      useFragment({
        fragment: `
          fragment TodoFields on Todo {
            id
            name
            __typename
            author { id name __typename }
          }`,
        data: {
          __typename: 'Todo',
          id: '1',
          name: null,
          completed: true,
          author: undefined,
        },
      })
    );

    expect(result.current).toEqual({
      fetching: true,
      data: {
        __typename: 'Todo',
        id: '1',
        name: null,
      },
    });
  });

  it('should correctly mark resolved w/ deferred nested fragment-selection that is undefined', () => {
    const { result } = renderHook(() =>
      useFragment({
        fragment: `
          fragment TodoFields on Todo {
            id
            name
            __typename
            ...AuthorFields @defer
          }

          fragment AuthorFields on Todo { author { id name __typename } }
        `,
        data: {
          __typename: 'Todo',
          id: '1',
          name: null,
          completed: true,
          author: undefined,
        },
      })
    );

    expect(result.current).toEqual({
      fetching: false,
      data: {
        __typename: 'Todo',
        id: '1',
        name: null,
      },
    });
  });

  it('should correctly mark loading w/ non-deferred nested fragment-selection that is undefined', () => {
    const { result } = renderHook(() =>
      useFragment({
        fragment: `
          fragment TodoFields on Todo {
            id
            name
            __typename
            ...AuthorFields
          }

          fragment AuthorFields on Todo { author { id name __typename } }
        `,
        data: {
          __typename: 'Todo',
          id: '1',
          name: null,
          completed: true,
          author: undefined,
        },
      })
    );

    expect(result.current).toEqual({
      fetching: true,
      data: {
        __typename: 'Todo',
        id: '1',
        name: null,
      },
    });
  });

  it('returns null data without masking when data is null', () => {
    const { result } = renderHook(() =>
      useFragment({ fragment: mockQuery, data: null })
    );

    expect(result.current).toEqual({ fetching: false, data: null });
  });

  it('returns undefined data without masking when data is undefined', () => {
    const { result } = renderHook(() =>
      useFragment({ fragment: mockQuery, data: undefined })
    );

    expect(result.current).toEqual({ fetching: false, data: undefined });
  });
});

describe('useFragment suspense', () => {
  const SongFields = `fragment SongFields on Song { id title __typename }`;

  const Song = ({ data }: { data: any }) => {
    const result = useFragment<any>({
      fragment: SongFields,
      data,
      context: { suspense: true },
    });
    return <p>{result.data ? result.data.title : 'no-title'}</p>;
  };

  it('suspends while a deferred field is missing, then renders once it arrives', async () => {
    const incomplete = { __typename: 'Song', id: '1', title: undefined };
    const complete = { __typename: 'Song', id: '1', title: 'Hello' };

    const view = render(
      <Suspense fallback={<p>loading</p>}>
        <Song data={incomplete} />
      </Suspense>
    );

    // The fragment isn't fulfilled yet, so the boundary shows its fallback.
    expect(view.container.textContent).toBe('loading');

    // The deferred patch arrives: the parent re-renders with the merged data.
    view.rerender(
      <Suspense fallback={<p>loading</p>}>
        <Song data={complete} />
      </Suspense>
    );
    // Flush the resolution of the suspense promise inside act(...).
    await act(async () => {});

    expect(view.container.textContent).toBe('Hello');
  });

  it('does not share suspense promises between unidentified objects', () => {
    const client = useClient() as any;
    const first = { title: undefined };
    const second = { title: undefined };
    const request = createRequest(SongFields, {});
    const fragment = request.query.definitions[0] as any;

    render(
      <Suspense fallback={<p>loading</p>}>
        <Song data={first} />
      </Suspense>
    );
    const firstPromise = getFragmentPromise(client, fragment, first);

    render(
      <Suspense fallback={<p>loading</p>}>
        <Song data={second} />
      </Suspense>
    );
    const secondPromise = getFragmentPromise(client, fragment, second);

    expect(firstPromise).toBeInstanceOf(Promise);
    expect(secondPromise).toBeInstanceOf(Promise);
    expect(secondPromise).not.toBe(firstPromise);
  });

  it('scopes suspense promises by fragment name', () => {
    const client = useClient() as any;
    const query = `
      fragment SongTitle on Song { title }
      fragment SongArtist on Song { artist }
    `;
    const data = {
      __typename: 'Song',
      id: '1',
      title: undefined,
      artist: undefined,
    };
    const request = createRequest(query, {});
    const fragments = request.query.definitions;
    const fragmentByName = (name: string) =>
      fragments.find(
        fragment => 'name' in fragment && fragment.name?.value === name
      ) as any;
    const Fragment = ({ name }: { name: string }) => {
      useFragment({
        fragment: query,
        name,
        data,
        context: { suspense: true },
      });
      return null;
    };

    render(
      <Suspense fallback={<p>loading</p>}>
        <Fragment name="SongTitle" />
      </Suspense>
    );
    const titlePromise = getFragmentPromise(
      client,
      fragmentByName('SongTitle'),
      data
    );

    render(
      <Suspense fallback={<p>loading</p>}>
        <Fragment name="SongArtist" />
      </Suspense>
    );
    const artistPromise = getFragmentPromise(
      client,
      fragmentByName('SongArtist'),
      data
    );

    expect(titlePromise).toBeInstanceOf(Promise);
    expect(artistPromise).toBeInstanceOf(Promise);
    expect(artistPromise).not.toBe(titlePromise);
  });

  it('does not suspend when the data is already complete', () => {
    const complete = { __typename: 'Song', id: '2', title: 'World' };

    const view = render(
      <Suspense fallback={<p>loading</p>}>
        <Song data={complete} />
      </Suspense>
    );

    expect(view.container.textContent).toBe('World');
  });

  it('suspends siblings independently by their entity identity', async () => {
    const view = render(
      <Suspense fallback={<p>loading</p>}>
        <Song data={{ __typename: 'Song', id: 'a', title: 'A' }} />
        <Song data={{ __typename: 'Song', id: 'b', title: undefined }} />
      </Suspense>
    );

    // One sibling is still pending, so the shared boundary shows the fallback.
    expect(view.container.textContent).toBe('loading');

    view.rerender(
      <Suspense fallback={<p>loading</p>}>
        <Song data={{ __typename: 'Song', id: 'a', title: 'A' }} />
        <Song data={{ __typename: 'Song', id: 'b', title: 'B' }} />
      </Suspense>
    );
    await act(async () => {});

    expect(view.container.textContent).toBe('AB');
  });

  it('suspends siblings without entity IDs independently', async () => {
    const Title = ({ data }: { data: any }) => {
      const result = useFragment<any>({
        fragment: `fragment TitleFields on Song { title __typename }`,
        data,
        context: { suspense: true },
      });
      return <p>{result.data.title}</p>;
    };
    const first: { __typename: string; title: string | undefined } = {
      __typename: 'Song',
      title: undefined,
    };
    const second: { __typename: string; title: string | undefined } = {
      __typename: 'Song',
      title: undefined,
    };

    const view = render(
      <>
        <Suspense fallback={<p>loading-first</p>}>
          <Title data={first} />
        </Suspense>
        <Suspense fallback={<p>loading-second</p>}>
          <Title data={second} />
        </Suspense>
      </>
    );
    expect(view.container.textContent).toBe('loading-firstloading-second');

    first.title = 'First';
    view.rerender(
      <>
        <Suspense fallback={<p>loading-first</p>}>
          <Title data={first} />
        </Suspense>
        <Suspense fallback={<p>loading-second</p>}>
          <Title data={second} />
        </Suspense>
      </>
    );
    await act(async () => {});
    expect(view.container.textContent).toBe('Firstloading-second');
  });

  it('keeps named fragments in one document independent', async () => {
    const document = `
      fragment TitleFields on Song { title __typename }
      fragment ArtistFields on Song { artist __typename }
    `;
    const data = {
      __typename: 'Song',
      title: undefined as string | undefined,
      artist: undefined as string | undefined,
    };
    const Field = ({ name }: { name: string }) => {
      const result = useFragment<any>({
        fragment: document,
        name,
        data,
        context: { suspense: true },
      });
      return <p>{result.data.title || result.data.artist}</p>;
    };

    const view = render(
      <>
        <Suspense fallback={<p>loading-title</p>}>
          <Field name="TitleFields" />
        </Suspense>
        <Suspense fallback={<p>loading-artist</p>}>
          <Field name="ArtistFields" />
        </Suspense>
      </>
    );
    expect(view.container.textContent).toBe('loading-titleloading-artist');

    data.title = 'Hello';
    view.rerender(
      <>
        <Suspense fallback={<p>loading-title</p>}>
          <Field name="TitleFields" />
        </Suspense>
        <Suspense fallback={<p>loading-artist</p>}>
          <Field name="ArtistFields" />
        </Suspense>
      </>
    );
    await act(async () => {});
    expect(view.container.textContent).toBe('Helloloading-artist');
  });

  it('resolves deferred fragment suspense from the query stream without a parent rerender', async () => {
    const client = useClient() as any;
    const subject = makeSubject<any>();
    client.suspense = true;
    client.executeQuery = vi.fn(() => subject.source);

    const SongFromQuery = () => {
      const [queryResult] = useQuery<any>({
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
      });

      const fragment = useFragment<any>({
        fragment: `fragment SongFields on Song { title }`,
        data: queryResult.data.song,
      });

      return <p>{fragment.data.title}</p>;
    };

    const view = render(
      <Suspense fallback={<p>loading</p>}>
        <SongFromQuery />
      </Suspense>
    );

    expect(view.container.textContent).toBe('loading');

    act(() => {
      subject.next({
        data: { song: { __typename: 'Song', id: '1' } },
        hasNext: true,
        stale: false,
      });
    });
    await act(async () => {});

    expect(view.container.textContent).toBe('loading');

    act(() => {
      subject.next({
        data: {
          song: { __typename: 'Song', id: '1', title: 'Hello' },
        },
        hasNext: false,
        stale: false,
      });
    });
    await act(async () => {});

    expect(view.container.textContent).toBe('Hello');
  });

  it('disposes deferred cache entries on unmount', async () => {
    const client = useClient() as any;
    const subject = makeSubject<any>();
    client.suspense = true;
    client.executeQuery = vi.fn(() => subject.source);

    const query = `
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
    `;

    const SongFromQuery = () => {
      useQuery<any>({ query });
      return null;
    };

    const view = render(
      <Suspense fallback={<p>loading</p>}>
        <SongFromQuery />
      </Suspense>
    );

    act(() => {
      subject.next({
        data: { song: { __typename: 'Song', id: '1' } },
        hasNext: true,
        stale: false,
      });
    });
    await act(async () => {});

    const key = createRequest(query, undefined).key;
    expect(client._deferred.get(key)).toBeTruthy();

    view.unmount();

    expect(client._deferred.get(key)).toBeUndefined();
  });
});

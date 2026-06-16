// @vitest-environment jsdom

import { FunctionalComponent as FC, h } from 'preact';
import { render, cleanup } from '@testing-library/preact';
import { expect, it, describe, beforeEach, afterEach } from 'vitest';

import { useFragment, UseFragmentState } from './useFragment';
import { Provider } from '../context';

const makeClient = (overrides: Record<string, any> = {}): any => ({
  suspense: false,
  ...overrides,
});

let snapshot: UseFragmentState<any> | undefined;

const Probe: FC<any> = props => {
  snapshot = useFragment(props);
  return null;
};

const renderProbe = (client: any, props: any) =>
  render(h(Provider, { value: client, children: [h(Probe, props)] }));

// Renders the hook and captures either the masked state or a thrown suspense
// promise, without a Suspense boundary, so we can assert the suspense bridge.
const captureSuspense = (client: any, props: any) => {
  let thrown: unknown;
  let rendered: UseFragmentState<any> | undefined;
  const Catcher: FC = () => {
    try {
      rendered = useFragment(props);
    } catch (error) {
      thrown = error;
    }
    return null;
  };
  render(h(Provider, { value: client, children: [h(Catcher, {})] }));
  return { thrown, rendered };
};

beforeEach(() => {
  snapshot = undefined;
});

afterEach(() => cleanup());

describe('useFragment masking', () => {
  it('masks data to the selected fields', () => {
    renderProbe(makeClient(), {
      query: `fragment TodoFields on Todo { id name __typename }`,
      data: {
        __typename: 'Todo',
        id: '1',
        name: 'Learn urql',
        completed: true,
      },
    });

    expect(snapshot).toEqual({
      fetching: false,
      data: { __typename: 'Todo', id: '1', name: 'Learn urql' },
    });
  });

  it('takes a named fragment to mask data', () => {
    renderProbe(makeClient(), {
      query: `fragment x on X { foo } fragment TodoFields on Todo { id name __typename }`,
      name: 'TodoFields',
      data: {
        __typename: 'Todo',
        id: '1',
        name: 'Learn urql',
        completed: true,
      },
    });

    expect(snapshot).toEqual({
      fetching: false,
      data: { __typename: 'Todo', id: '1', name: 'Learn urql' },
    });
  });

  it('marks fetching for a missing non-optional field', () => {
    renderProbe(makeClient(), {
      query: `fragment TodoFields on Todo { id name __typename }`,
      data: { __typename: 'Todo', id: '1', name: undefined },
    });

    expect(snapshot).toEqual({
      fetching: true,
      data: { __typename: 'Todo', id: '1' },
    });
  });

  it('treats a missing @defer-red fragment spread as fulfilled', () => {
    renderProbe(makeClient(), {
      query: `
        fragment TodoFields on Todo {
          id name __typename
          ...AuthorFields @defer
        }

        fragment AuthorFields on Todo { author { id name __typename } }
      `,
      name: 'TodoFields',
      data: { __typename: 'Todo', id: '1', name: null, author: undefined },
    });

    expect(snapshot).toEqual({
      fetching: false,
      data: { __typename: 'Todo', id: '1', name: null },
    });
  });

  it('returns null data without masking when data is null', () => {
    renderProbe(makeClient(), {
      query: `fragment TodoFields on Todo { id name __typename }`,
      data: null,
    });

    expect(snapshot).toEqual({ fetching: false, data: null });
  });
});

describe('useFragment suspense', () => {
  const SongFields = `fragment SongFields on Song { id title __typename }`;

  it('throws a suspense promise while a field is missing', () => {
    const { thrown, rendered } = captureSuspense(makeClient(), {
      query: SongFields,
      data: { __typename: 'Song', id: '1', title: undefined },
      context: { suspense: true },
    });

    expect(rendered).toBeUndefined();
    expect(thrown).toBeInstanceOf(Promise);
  });

  it('does not suspend when the data is already complete', () => {
    const { thrown, rendered } = captureSuspense(makeClient(), {
      query: SongFields,
      data: { __typename: 'Song', id: '1', title: 'World' },
      context: { suspense: true },
    });

    expect(thrown).toBeUndefined();
    expect(rendered).toEqual({
      fetching: false,
      data: { __typename: 'Song', id: '1', title: 'World' },
    });
  });
});

import { renderHook } from '@testing-library/react-hooks';
import { vi, expect, it, describe, beforeAll } from 'vitest';

import { useFragment } from './useFragment';

vi.mock('../context', () => {
  const mock = {};

  return {
    useClient: () => mock,
  };
});

const mockQuery = `
  fragment TodoFields on Todo {
    id
    name
    __typename
  }
`;

describe('useFragment', () => {
  beforeAll(() => {
    // TODO: Fix use of act()
    vi.spyOn(global.console, 'error').mockImplementation(() => {
      // do nothing
    });
  });

  it('should correctly mask data', () => {
    const { result } = renderHook(
      ({ query }) =>
        useFragment({
          query,
          data: {
            __typename: 'Todo',
            id: '1',
            name: 'Learn urql',
            completed: true,
          },
        }),
      { initialProps: { query: mockQuery } }
    );

    const state = result.current;
    expect(state).toEqual({
      fetching: false,
      data: {
        __typename: 'Todo',
        id: '1',
        name: 'Learn urql',
      },
    });
  });

  it('should correctly mask data w/ null attribute', () => {
    const { result } = renderHook(
      ({ query }) =>
        useFragment({
          query,
          data: { __typename: 'Todo', id: '1', name: null, completed: true },
        }),
      { initialProps: { query: mockQuery } }
    );

    const state = result.current;
    expect(state).toEqual({
      fetching: false,
      data: {
        __typename: 'Todo',
        id: '1',
        name: null,
      },
    });
  });

  it('should correctly indicate loading w/ undefined attribute', () => {
    const { result } = renderHook(
      ({ query }) =>
        useFragment({
          query,
          data: {
            __typename: 'Todo',
            id: '1',
            name: undefined,
            completed: true,
          },
        }),
      { initialProps: { query: mockQuery } }
    );

    const state = result.current;
    expect(state).toEqual({
      fetching: true,
      data: {
        __typename: 'Todo',
        id: '1',
      },
    });
  });

  it('should correctly mask data w/ nested object', () => {
    const { result } = renderHook(
      ({ query }) =>
        useFragment({
          query,
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
        }),
      {
        initialProps: {
          query: `
        fragment TodoFields on Todo {
          id
          name
          __typename
          author { id name __typename }
        }`,
        },
      }
    );

    const state = result.current;
    expect(state).toEqual({
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
    const { result } = renderHook(
      ({ query }) =>
        useFragment({
          query,
          data: {
            __typename: 'Todo',
            id: '1',
            name: null,
            completed: true,
            author: null,
          },
        }),
      {
        initialProps: {
          query: `
        fragment TodoFields on Todo {
          id
          name
          __typename
          author { id name __typename }
        }`,
        },
      }
    );

    const state = result.current;
    expect(state).toEqual({
      fetching: false,
      data: {
        __typename: 'Todo',
        id: '1',
        name: null,
        author: null,
      },
    });
  });

  it('should correctly mark loading w/ nested selection that is undefined', () => {
    const { result } = renderHook(
      ({ query }) =>
        useFragment({
          query,
          data: {
            __typename: 'Todo',
            id: '1',
            name: null,
            completed: true,
            author: undefined,
          },
        }),
      {
        initialProps: {
          query: `
        fragment TodoFields on Todo {
          id
          name
          __typename
          author { id name __typename }
        }`,
        },
      }
    );

    const state = result.current;
    expect(state).toEqual({
      fetching: true,
      data: {
        __typename: 'Todo',
        id: '1',
        name: null,
      },
    });
  });

  it('should correctly mark resolved w/ deferred nested fragment-selection that is undefined', () => {
    const { result } = renderHook(
      ({ query }) =>
        useFragment({
          query,
          data: {
            __typename: 'Todo',
            id: '1',
            name: null,
            completed: true,
            author: undefined,
          },
        }),
      {
        initialProps: {
          query: `
        fragment TodoFields on Todo {
          id
          name
          __typename
          ...AuthorFields @defer
        }

        fragment AuthorFields on Todo { author { id name __typename } }
        `,
        },
      }
    );

    const state = result.current;
    expect(state).toEqual({
      fetching: false,
      data: {
        __typename: 'Todo',
        id: '1',
        name: null,
      },
    });
  });

  it('should correctly mark resolved w/ nested fragment-selection that is undefined', () => {
    const { result } = renderHook(
      ({ query }) =>
        useFragment({
          query,
          data: {
            __typename: 'Todo',
            id: '1',
            name: null,
            completed: true,
            author: undefined,
          },
        }),
      {
        initialProps: {
          query: `
        fragment TodoFields on Todo {
          id
          name
          __typename
          ...AuthorFields
        }

        fragment AuthorFields on Todo { author { id name __typename }  }
        `,
        },
      }
    );

    const state = result.current;
    expect(state).toEqual({
      fetching: true,
      data: {
        __typename: 'Todo',
        id: '1',
        name: null,
      },
    });
  });
});

// @vitest-environment jsdom

import { FunctionalComponent as FC, h } from 'preact';
import { render, cleanup, act } from '@testing-library/preact';
import { OperationContext } from '@urql/core';
import { map, interval, pipe, never, onStart, onEnd, empty } from 'wonka';

import { vi, expect, it, beforeEach, describe, afterEach, Mock } from 'vitest';

import { useQuery, UseQueryArgs, UseQueryState } from './useQuery';
import { Provider } from '../context';

const mock = {
  executeQuery: vi.fn(() =>
    pipe(
      interval(400),
      map((i: number) => ({ data: i, error: i + 1, extensions: { i: 1 } }))
    )
  ),
};

const client = mock as { executeQuery: Mock };
const props: UseQueryArgs<{ myVar: number }> = {
  query: '{ example }',
  variables: {
    myVar: 1234,
  },
  pause: false,
};

let state: UseQueryState<any> | undefined;
let execute: ((_opts?: Partial<OperationContext>) => void) | undefined;

const QueryUser: FC<UseQueryArgs<{ myVar: number }>> = ({
  query,
  variables,
  pause,
}) => {
  [state, execute] = useQuery({ query, variables, pause });
  return h('p', {}, state.data);
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(global.console, 'error');
});

describe('useQuery', () => {
  beforeEach(() => {
    client.executeQuery.mockClear();
    state = undefined;
    execute = undefined;
  });

  afterEach(() => cleanup());

  it('executes subscription', () => {
    render(
      h(Provider, {
        value: client as any,
        children: [h(QueryUser, { ...props })],
      })
    );
    expect(client.executeQuery).toBeCalledTimes(1);
  });

  it('passes query and vars to executeQuery', () => {
    render(
      h(Provider, {
        value: client as any,
        children: [h(QueryUser, { ...props })],
      })
    );

    expect(client.executeQuery).toBeCalledWith(
      {
        key: expect.any(Number),
        query: expect.any(Object),
        variables: props.variables,
      },
      expect.objectContaining({
        requestPolicy: undefined,
      })
    );
  });

  it('sets fetching to true', () => {
    const { rerender } = render(
      h(Provider, {
        value: client as any,
        children: [h(QueryUser, { ...props })],
      })
    );

    rerender(
      h(Provider, {
        value: client as any,
        children: [h(QueryUser, { ...props })],
      })
    );
    expect(state).toHaveProperty('fetching', true);
  });

  it('forwards data response', () => {
    const { rerender } = render(
      h(Provider, {
        value: client as any,
        children: [h(QueryUser, { ...props })],
      })
    );

    rerender(
      h(Provider, {
        value: client as any,
        children: [h(QueryUser, { ...props })],
      })
    );

    act(() => {
      vi.advanceTimersByTime(400);
      rerender(
        h(Provider, {
          value: client as any,
          children: [h(QueryUser, { ...props })],
        })
      );
    });

    expect(state).toHaveProperty('data', 0);
  });

  it('forwards error response', () => {
    const { rerender } = render(
      h(Provider, {
        value: client as any,
        children: [h(QueryUser, { ...props })],
      })
    );

    rerender(
      h(Provider, {
        value: client as any,
        children: [h(QueryUser, { ...props })],
      })
    );

    act(() => {
      vi.advanceTimersByTime(400);
      rerender(
        h(Provider, {
          value: client as any,
          children: [h(QueryUser, { ...props })],
        })
      );
    });

    expect(state).toHaveProperty('error', 1);
  });

  it('forwards extensions response', () => {
    const { rerender } = render(
      h(Provider, {
        value: client as any,
        children: [h(QueryUser, { ...props })],
      })
    );

    rerender(
      h(Provider, {
        value: client as any,
        children: [h(QueryUser, { ...props })],
      })
    );

    act(() => {
      vi.advanceTimersByTime(400);
      rerender(
        h(Provider, {
          value: client as any,
          children: [h(QueryUser, { ...props })],
        })
      );
    });

    expect(state).toHaveProperty('extensions', { i: 1 });
  });

  it('sets fetching to false', () => {
    const { rerender } = render(
      h(Provider, {
        value: client as any,
        children: [h(QueryUser, { ...props })],
      })
    );

    rerender(
      h(Provider, {
        value: client as any,
        children: [h(QueryUser, { ...props })],
      })
    );

    act(() => {
      vi.advanceTimersByTime(400);
      rerender(
        h(Provider, {
          value: client as any,
          children: [h(QueryUser, { ...props })],
        })
      );
    });

    expect(state).toHaveProperty('fetching', false);
  });

  describe('on change', () => {
    const q = 'query NewQuery { example }';

    it('new query executes subscription', () => {
      const { rerender } = render(
        h(Provider, {
          value: client as any,
          children: [h(QueryUser, { ...props })],
        })
      );

      rerender(
        h(Provider, {
          value: client as any,
          children: [h(QueryUser, { ...props, query: q })],
        })
      );

      act(() => {
        rerender(
          h(Provider, {
            value: client as any,
            children: [h(QueryUser, { ...props, query: q })],
          })
        );
      });

      expect(client.executeQuery).toBeCalledTimes(2);
    });
  });

  describe('on unmount', () => {
    const start = vi.fn();
    const unsubscribe = vi.fn();

    beforeEach(() => {
      client.executeQuery.mockReturnValue(
        pipe(never, onStart(start), onEnd(unsubscribe))
      );
    });

    it('unsubscribe is called', () => {
      const { unmount } = render(
        h(Provider, {
          value: client as any,
          children: [h(QueryUser, { ...props })],
        })
      );

      act(() => {
        unmount();
      });

      expect(start).toBeCalledTimes(2);
      expect(unsubscribe).toBeCalledTimes(2);
    });
  });

  describe('active teardown', () => {
    it('sets fetching to false when the source ends', () => {
      client.executeQuery.mockReturnValueOnce(empty);
      act(() => {
        render(
          h(Provider, {
            value: client as any,
            children: [h(QueryUser, { ...props })],
          })
        );
      });
      expect(client.executeQuery).toHaveBeenCalled();
      expect(state).toMatchObject({ fetching: false });
    });
  });

  describe('execute query', () => {
    it('triggers query execution', () => {
      render(
        h(Provider, {
          value: client as any,
          children: [h(QueryUser, { ...props })],
        })
      );
      act(() => execute && execute());
      expect(client.executeQuery).toBeCalledTimes(2);
    });
  });

  describe('pause', () => {
    it('skips executing the query if pause is true', () => {
      render(
        h(Provider, {
          value: client as any,
          children: [h(QueryUser, { ...props, pause: true })],
        })
      );
      expect(client.executeQuery).not.toBeCalled();
    });

    it('skips executing queries if pause updates to true', () => {
      const { rerender } = render(
        h(Provider, {
          value: client as any,
          children: [h(QueryUser, { ...props })],
        })
      );

      rerender(
        h(Provider, {
          value: client as any,
          children: [h(QueryUser, { ...props, pause: true })],
        })
      );

      expect(client.executeQuery).toBeCalledTimes(1);
    });
  });
});

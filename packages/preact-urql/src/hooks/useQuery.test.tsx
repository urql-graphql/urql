import { FunctionalComponent as FC, h } from 'preact';
import { render, cleanup, act } from '@testing-library/preact';
import { OperationContext } from '@urql/core';
import { map, interval, pipe, never, onStart, onEnd, empty } from 'wonka';
import {
  vi,
  expect,
  it,
  beforeEach,
  describe,
  beforeAll,
  Mock,
  afterEach,
} from 'vitest';

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

beforeAll(() => {
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

  it('forwards data response', async () => {
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

    await new Promise(res => {
      setTimeout(() => {
        rerender(
          h(Provider, {
            value: client as any,
            children: [h(QueryUser, { ...props })],
          })
        );
        expect(state).toHaveProperty('data', 0);
        res(null);
      }, 400);
    });
  });

  it('forwards error response', async () => {
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

    await new Promise(res => {
      setTimeout(() => {
        rerender(
          h(Provider, {
            value: client as any,
            children: [h(QueryUser, { ...props })],
          })
        );
        expect(state).toHaveProperty('error', 1);
        res(null);
      }, 400);
    });
  });

  it('forwards extensions response', async () => {
    const { rerender } = render(
      h(Provider, {
        value: client as any,
        children: [h(QueryUser, { ...props })],
      })
    );
    /**
     * Have to call update (without changes) in order to see the
     * result of the state change.
     */
    rerender(
      h(Provider, {
        value: client as any,
        children: [h(QueryUser, { ...props })],
      })
    );

    await new Promise(res => {
      setTimeout(() => {
        rerender(
          h(Provider, {
            value: client as any,
            children: [h(QueryUser, { ...props })],
          })
        );

        expect(state).toHaveProperty('extensions', { i: 1 });
        res(null);
      }, 400);
    });
  });

  it('sets fetching to false', async () => {
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

    await new Promise(res => {
      setTimeout(() => {
        rerender(
          h(Provider, {
            value: client as any,
            children: [h(QueryUser, { ...props })],
          })
        );
        expect(state).toHaveProperty('fetching', false);
        res(null);
      }, 400);
    });
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

      /**
       * Have to call update twice for the change to be detected.
       * Only a single change is detected (updating 5 times still only calls
       * execute subscription twice).
       */
      rerender(
        h(Provider, {
          value: client as any,
          children: [h(QueryUser, { ...props, query: q })],
        })
      );
      rerender(
        h(Provider, {
          value: client as any,
          children: [h(QueryUser, { ...props, query: q })],
        })
      );

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

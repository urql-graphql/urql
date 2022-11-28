import { FunctionalComponent as FC, h } from 'preact';
import { render, cleanup, act } from '@testing-library/preact';
import { OperationContext } from '@urql/core';
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
import { merge, fromValue, never, empty } from 'wonka';

import { useSubscription, UseSubscriptionState } from './useSubscription';
import { Provider } from '../context';

const data = { data: 1234, error: 5678 };
const mock = {
  // @ts-ignore
  executeSubscription: vi.fn(() => merge([fromValue(data), never])),
};

const client = mock as { executeSubscription: Mock };
const query = 'subscription Example { example }';

let state: UseSubscriptionState<any> | undefined;
let execute: ((_opts?: Partial<OperationContext>) => void) | undefined;

const SubscriptionUser: FC<{
  q: string;
  handler?: (_prev: any, _data: any) => any;
  context?: Partial<OperationContext>;
  pause?: boolean;
}> = ({ q, handler, context, pause = false }) => {
  [state, execute] = useSubscription({ query: q, context, pause }, handler);
  return h('p', {}, state.data);
};

beforeAll(() => {
  vi.spyOn(global.console, 'error').mockImplementation(() => {
    // do nothing
  });
});

describe('useSubscription', () => {
  beforeEach(() => {
    client.executeSubscription.mockClear();
    state = undefined;
    execute = undefined;
  });

  const props = { q: query };

  afterEach(() => cleanup());

  it('executes subscription', () => {
    render(
      h(Provider, {
        value: client as any,
        children: [h(SubscriptionUser, { ...props })],
      })
    );
    expect(client.executeSubscription).toBeCalledTimes(1);
  });

  it('should support setting context in useSubscription params', () => {
    render(
      h(Provider, {
        value: client as any,
        children: [h(SubscriptionUser, { ...props, context: { url: 'test' } })],
      })
    );
    expect(client.executeSubscription).toBeCalledWith(
      {
        key: expect.any(Number),
        query: expect.any(Object),
        variables: {},
      },
      {
        url: 'test',
      }
    );
  });

  describe('on subscription', () => {
    it('forwards client response', () => {
      const { rerender } = render(
        h(Provider, {
          value: client as any,
          children: [h(SubscriptionUser, { ...props })],
        })
      );
      /**
       * Have to call update (without changes) in order to see the
       * result of the state change.
       */
      rerender(
        h(Provider, {
          value: client as any,
          children: [h(SubscriptionUser, { ...props })],
        })
      );
      expect(state).toEqual({
        ...data,
        extensions: undefined,
        fetching: true,
        stale: false,
      });
    });
  });

  it('calls handler', () => {
    const handler = vi.fn();
    const { rerender } = render(
      h(Provider, {
        value: client as any,
        children: [h(SubscriptionUser, { ...props, handler })],
      })
    );
    rerender(
      h(Provider, {
        value: client as any,
        children: [h(SubscriptionUser, { ...props })],
      })
    );
    expect(handler).toBeCalledTimes(2);
    expect(handler).toBeCalledWith(undefined, 1234);
  });

  describe('active teardown', () => {
    it('sets fetching to false when the source ends', () => {
      client.executeSubscription.mockReturnValueOnce(empty);
      render(
        h(Provider, {
          value: client as any,
          children: [h(SubscriptionUser, { ...props })],
        })
      );
      expect(client.executeSubscription).toHaveBeenCalled();
      expect(state).toMatchObject({ fetching: false });
    });
  });

  describe('execute subscription', () => {
    it('triggers subscription execution', () => {
      render(
        h(Provider, {
          value: client as any,
          children: [h(SubscriptionUser, { ...props })],
        })
      );
      act(() => execute && execute());
      expect(client.executeSubscription).toBeCalledTimes(2);
    });
  });

  describe('pause', () => {
    const props = { q: query };

    it('skips executing the query if pause is true', () => {
      render(
        h(Provider, {
          value: client as any,
          children: [h(SubscriptionUser, { ...props, pause: true })],
        })
      );
      expect(client.executeSubscription).not.toBeCalled();
    });

    it('skips executing queries if pause updates to true', () => {
      const { rerender } = render(
        h(Provider, {
          value: client as any,
          children: [h(SubscriptionUser, { ...props })],
        })
      );

      rerender(
        h(Provider, {
          value: client as any,
          children: [h(SubscriptionUser, { ...props, pause: true })],
        })
      );
      rerender(
        h(Provider, {
          value: client as any,
          children: [h(SubscriptionUser, { ...props, pause: true })],
        })
      );
      expect(client.executeSubscription).toBeCalledTimes(1);
      expect(state).toMatchObject({ fetching: false });
    });
  });
});

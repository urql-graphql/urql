import { h } from 'preact';
import { cleanup, render } from '@testing-library/preact';
import { map, interval, pipe } from 'wonka';
import { vi, expect, it, beforeEach, describe, afterEach } from 'vitest';

import { Provider } from '../context';
import { Subscription } from './Subscription';

const query = 'subscription Example { example }';
const client = {
  executeSubscription: vi.fn(() =>
    pipe(
      interval(200),
      map((i: number) => ({ data: i, error: i + 1 }))
    )
  ),
};

describe('Subscription', () => {
  beforeEach(() => {
    vi.spyOn(global.console, 'error').mockImplementation(() => {
      // do nothing
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('Should execute the subscription', async () => {
    let props = {};
    const Test = () => h('p', {}, 'hi');
    const App = () => {
      // @ts-ignore
      return h(Provider, {
        value: client,
        children: [
          // @ts-ignore
          h(Subscription, { query }, ({ data, fetching, error }) => {
            props = { data, fetching, error };
            // @ts-ignore
            return h(Test, {});
          }),
        ],
      });
    };
    render(h(App, {}));
    expect(props).toStrictEqual({
      data: undefined,
      fetching: true,
      error: undefined,
    });

    await new Promise(res => {
      setTimeout(() => {
        expect(props).toStrictEqual({ data: 0, fetching: true, error: 1 });
        res(null);
      }, 300);
    });
  });
});

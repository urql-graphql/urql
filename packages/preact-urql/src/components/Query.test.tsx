// @vitest-environment jsdom

import { h } from 'preact';
import { cleanup, render } from '@testing-library/preact';
import { map, interval, pipe } from 'wonka';
import { vi, expect, it, beforeEach, describe, afterEach } from 'vitest';

import { Query } from './Query';
import { Provider } from '../context';

const query = '{ example }';
const variables = {
  myVar: 1234,
};

const client = {
  executeQuery: vi.fn(() =>
    pipe(
      interval(200),
      map((i: number) => ({ data: i, error: i + 1 }))
    )
  ),
};

describe('Query', () => {
  beforeEach(() => {
    vi.spyOn(global.console, 'error').mockImplementation(() => {
      // do nothing
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('Should execute the query', async () => {
    let props = {};
    const Test = () => h('p', {}, 'hi');
    const App = () => {
      // @ts-ignore
      return h(Provider, {
        value: client,
        children: [
          // @ts-ignore
          h(Query, { query, variables }, ({ data, fetching, error }) => {
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
        expect(props).toStrictEqual({ data: 0, fetching: false, error: 1 });
        res(null);
      }, 250);
    });
  });
});

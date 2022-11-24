import { h } from 'preact';
import { act, cleanup, render } from '@testing-library/preact';
import { pipe, fromValue, delay } from 'wonka';
import { vi, expect, it, beforeEach, describe, afterEach, Mock } from 'vitest';

import { Provider } from '../context';
import { Mutation } from './Mutation';

const mock = {
  executeMutation: vi.fn(() =>
    pipe(fromValue({ data: 1, error: 2, extensions: { i: 1 } }), delay(200))
  ),
};
const client = mock as { executeMutation: Mock };
const query = 'mutation Example { example }';

describe('Mutation', () => {
  beforeEach(() => {
    vi.spyOn(global.console, 'error').mockImplementation(() => {
      // do nothing
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('Should execute the mutation', async () => {
    // eslint-disable-next-line
    let execute = () => {},
      props = {};
    const Test = () => h('p', {}, 'hi');
    const App = () => {
      // @ts-ignore
      return h(Provider, {
        value: client,
        children: [
          // @ts-ignore
          h(
            Mutation,
            { query },
            ({ data, fetching, error, executeMutation }) => {
              execute = executeMutation;
              props = { data, fetching, error };
              // @ts-ignore
              return h(Test, {});
            }
          ),
        ],
      });
    };
    render(h(App, {}));
    expect(client.executeMutation).toBeCalledTimes(0);
    expect(props).toStrictEqual({
      data: undefined,
      fetching: false,
      error: undefined,
    });
    act(() => {
      execute();
    });
    expect(props).toStrictEqual({
      data: undefined,
      fetching: true,
      error: undefined,
    });

    await new Promise(res => {
      setTimeout(() => {
        expect(props).toStrictEqual({ data: 1, fetching: false, error: 2 });
        res(null);
      }, 400);
    });
  });
});

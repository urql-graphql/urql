import { h } from 'preact';
import { act, cleanup, render } from '@testing-library/preact';
import { pipe, fromValue, delay } from 'wonka';
import { Provider } from '../context';
import { Mutation } from './Mutation';

// @ts-ignore
const React = {
  createElement: h,
};

const mock = {
  executeMutation: jest.fn(() =>
    pipe(fromValue({ data: 1, error: 2, extensions: { i: 1 } }), delay(200))
  ),
};
const client = mock as { executeMutation: jest.Mock };
const query = 'mutation Example { example }';

describe('Mutation', () => {
  beforeEach(() => {
    jest.spyOn(global.console, 'error').mockImplementation();
  });

  afterEach(() => {
    cleanup();
  });

  it('Should execute the mutation', done => {
    // eslint-disable-next-line
    let execute = () => {},
      props = {};
    const Test = () => <p>Hi</p>;
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
    setTimeout(() => {
      expect(props).toStrictEqual({ data: 1, fetching: false, error: 2 });
      done();
    }, 400);
  });
});

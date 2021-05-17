import { h } from 'preact';
import { cleanup, render } from '@testing-library/preact';
import { map, interval, pipe } from 'wonka';
import { Query } from './Query';
import { Provider } from '../context';

const query = '{ example }';
const variables = {
  myVar: 1234,
};

// @ts-ignore
const React = {
  createElement: h,
};

const client = {
  executeQuery: jest.fn(() =>
    pipe(
      interval(200),
      map((i: number) => ({ data: i, error: i + 1 }))
    )
  ),
};

describe('Query', () => {
  beforeEach(() => {
    jest.spyOn(global.console, 'error').mockImplementation();
  });

  afterEach(() => {
    cleanup();
  });

  it('Should execute the query', done => {
    let props = {};
    const Test = () => <p>Hi</p>;
    const App = () => {
      // @ts-ignore
      return h(Provider, {
        value: client,
        children: [
          // @ts-ignore
          h(Query, { query, variables }, ({ data, fetching, error }) => {
            props = { data, fetching, error };
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
    setTimeout(() => {
      expect(props).toStrictEqual({ data: 0, fetching: false, error: 1 });
      done();
    }, 250);
  });
});

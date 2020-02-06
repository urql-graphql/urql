jest.mock('../context', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { pipe, interval, map } = require('wonka');
  const mock = {
    executeSubscription: jest.fn(() =>
      pipe(
        interval(200),
        map((i: number) => ({ data: i, error: i + 1 }))
      )
    ),
  };

  return {
    useClient: () => mock,
  };
});

import * as React from 'react';
import { cleanup, render } from '@testing-library/react';
import { Subscription } from './Subscription';

const query = 'subscription Example { example }';

describe('Subscription', () => {
  beforeEach(() => {
    // TODO: Fix use of act()
    jest.spyOn(global.console, 'error').mockImplementation();
  });

  afterEach(() => {
    cleanup();
  });

  it('Should execute the subscription', done => {
    let props = {};
    const Test = () => <p>Hi</p>;
    const App = () => {
      return (
        // @ts-ignore
        <Subscription query={query}>
          {({ data, fetching, error }) => {
            props = { data, fetching, error };
            return <Test />;
          }}
        </Subscription>
      );
    };
    render(<App />);
    expect(props).toStrictEqual({
      data: undefined,
      fetching: true,
      error: undefined,
    });
    setTimeout(() => {
      expect(props).toStrictEqual({ data: 0, fetching: true, error: 1 });
      done();
    }, 200);
  });
});

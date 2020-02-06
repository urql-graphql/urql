jest.mock('../context', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { map, interval, pipe } = require('wonka');
  const mock = {
    executeQuery: jest.fn(() =>
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
import { Query } from './Query';

// @ts-ignore
const query = '{ example }';
const variables = {
  myVar: 1234,
};

describe('Query', () => {
  beforeEach(() => {
    // TODO: Fix use of act()
    jest.spyOn(global.console, 'error').mockImplementation();
  });

  afterEach(() => {
    cleanup();
  });

  it('Should execute the query', done => {
    let props = {};
    const Test = () => <p>Hi</p>;
    const App = () => {
      return (
        // @ts-ignore
        <Query query={query} variables={variables}>
          {({ data, fetching, error }) => {
            props = { data, fetching, error };
            return <Test />;
          }}
        </Query>
      );
    };
    render(<App />);
    expect(props).toStrictEqual({
      data: undefined,
      fetching: true,
      error: undefined,
    });
    setTimeout(() => {
      expect(props).toStrictEqual({ data: 0, fetching: false, error: 1 });
      done();
    }, 200);
  });
});

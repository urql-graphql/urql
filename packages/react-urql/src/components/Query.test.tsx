import { vi, expect, it, beforeEach, describe, afterEach } from 'vitest';

vi.mock('../context', async () => {
  const { map, interval, pipe } = await vi.importActual<typeof import('wonka')>(
    'wonka'
  );

  const mock = {
    executeQuery: vi.fn(() =>
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
    vi.spyOn(global.console, 'error').mockImplementation(() => {
      // do nothing
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('Should execute the query', async () => {
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
    await new Promise(res => {
      setTimeout(() => {
        expect(props).toStrictEqual({ data: 0, fetching: false, error: 1 });
        res(null);
      }, 200);
    });
  });
});

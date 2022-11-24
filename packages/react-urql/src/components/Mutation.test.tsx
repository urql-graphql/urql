/* eslint-disable react-hooks/rules-of-hooks */
import { vi, expect, it, beforeEach, describe, Mock, afterEach } from 'vitest';

vi.mock('../context', async () => {
  const { delay, fromValue, pipe } = await vi.importActual('wonka');
  const mock = {
    executeMutation: vi.fn(() =>
      pipe(fromValue({ data: 1, error: 2 }), delay(200))
    ),
  };

  return {
    useClient: () => mock,
  };
});

import * as React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { Mutation } from './Mutation';
import { useClient } from '../context';

// @ts-ignore
const client = useClient() as { executeMutation: Mock };
const query = 'mutation Example { example }';

describe('Mutation', () => {
  beforeEach(() => {
    // TODO: Fix use of act()
    vi.spyOn(global.console, 'error').mockImplementation(() => {
      // do nothing
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('Should execute the mutation', async () => {
    let execute = () => {
        /* noop */
      },
      props = {};
    const Test = () => <p>Hi</p>;
    const App = () => {
      return (
        // @ts-ignore
        <Mutation query={query}>
          {({ data, fetching, error, executeMutation }) => {
            execute = executeMutation;
            props = { data, fetching, error };
            return <Test />;
          }}
        </Mutation>
      );
    };
    render(<App />);
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

/* eslint-disable react-hooks/rules-of-hooks */

// Note: Testing for hooks is not yet supported in Enzyme - https://github.com/airbnb/enzyme/issues/2011
vi.mock('../context', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { delay, fromValue, pipe } = require('wonka');
  const mock = {
    executeMutation: vi.fn(() =>
      pipe(fromValue({ data: 1, error: 2, extensions: { i: 1 } }), delay(200))
    ),
  };

  return {
    useClient: () => mock,
  };
});

import { print } from 'graphql';
import { gql } from '@urql/core';
import React from 'react';
import renderer, { act } from 'react-test-renderer';

import { useClient } from '../context';
import { useMutation } from './useMutation';

// @ts-ignore
const client = useClient() as { executeMutation: vi.Mock };

const props = {
  query: 'mutation Example { example }',
};

let state: any;
let execute: any;

const MutationUser = ({ query }: { query: any }) => {
  const [s, e] = useMutation(query);
  state = s;
  execute = e;
  return <p>{s.data}</p>;
};

beforeAll(() => {
  // TODO: Fix use of act()
  vi.spyOn(global.console, 'error').mockImplementation();
});

beforeEach(() => {
  client.executeMutation.mockClear();
  state = undefined;
  execute = undefined;
});

describe('on initial useEffect', () => {
  it('initialises default state', () => {
    renderer.create(<MutationUser {...props} />);
    expect(state).toMatchSnapshot();
  });

  it('does not execute subscription', () => {
    renderer.create(<MutationUser {...props} />);
    expect(client.executeMutation).toBeCalledTimes(0);
  });
});

describe('on execute', () => {
  const vars = { test: 1234 };

  it('sets fetching to true', () => {
    renderer.create(<MutationUser {...props} />);
    act(() => {
      execute(vars);
    });
    expect(state).toHaveProperty('fetching', true);
  });

  it('calls executeMutation', () => {
    renderer.create(<MutationUser {...props} />);
    act(() => {
      execute(vars);
    });
    expect(client.executeMutation).toBeCalledTimes(1);
  });

  it('calls executeMutation with query', () => {
    renderer.create(<MutationUser {...props} />);
    act(() => {
      execute(vars);
    });

    const call = client.executeMutation.mock.calls[0][0];
    expect(print(call.query)).toBe(print(gql(props.query)));
  });

  it('calls executeMutation with variables', () => {
    renderer.create(<MutationUser {...props} />);
    act(() => {
      execute(vars);
    });
    expect(client.executeMutation.mock.calls[0][0]).toHaveProperty(
      'variables',
      vars
    );
  });

  it('can adjust context in executeMutation', () => {
    renderer.create(<MutationUser {...props} />);
    act(() => {
      execute(vars, { url: 'test' });
    });
    expect(client.executeMutation.mock.calls[0][1].url).toBe('test');
  });
});

describe('on subscription update', () => {
  it('forwards data response', async () => {
    const wrapper = renderer.create(<MutationUser {...props} />);
    await execute();
    wrapper.update(<MutationUser {...props} />);

    expect(state).toHaveProperty('data', 1);
  });

  it('forwards error response', async () => {
    const wrapper = renderer.create(<MutationUser {...props} />);
    await execute();
    wrapper.update(<MutationUser {...props} />);

    expect(state).toHaveProperty('error', 2);
  });

  it('forwards extensions response', async () => {
    const wrapper = renderer.create(<MutationUser {...props} />);
    await execute();
    wrapper.update(<MutationUser {...props} />);

    expect(state).toHaveProperty('extensions', { i: 1 });
  });

  it('sets fetching to false', async () => {
    const wrapper = renderer.create(<MutationUser {...props} />);
    wrapper.update(<MutationUser {...props} />);

    await execute();
    wrapper.update(<MutationUser {...props} />);
    expect(state).toHaveProperty('fetching', false);
  });
});

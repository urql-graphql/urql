/* eslint-disable react-hooks/rules-of-hooks */

// Note: Testing for hooks is not yet supported in Enzyme - https://github.com/airbnb/enzyme/issues/2011
jest.mock('../context', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { map, interval, pipe } = require('wonka');
  const mock = {
    executeQuery: jest.fn(() =>
      pipe(
        interval(400),
        map((i: number) => ({ data: i, error: i + 1, extensions: { i: 1 } }))
      )
    ),
  };

  return {
    useClient: () => mock,
  };
});

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { pipe, onStart, onEnd, never } from 'wonka';
import { OperationContext } from '@urql/core';

import { useQuery, UseQueryArgs, UseQueryState } from './useQuery';
import { useClient } from '../context';

// @ts-ignore
const client = useClient() as { executeQuery: jest.Mock };

const props: UseQueryArgs<{ myVar: number }> = {
  query: '{ example }',
  variables: {
    myVar: 1234,
  },
  pause: false,
};

let state: UseQueryState<any> | undefined;
let execute: ((opts?: Partial<OperationContext>) => void) | undefined;

const QueryUser = ({
  query,
  variables,
  pause,
}: UseQueryArgs<{ myVar: number }>) => {
  const [s, e] = useQuery({ query, variables, pause });
  state = s;
  execute = e;
  return <p>{s.data}</p>;
};

beforeAll(() => {
  // TODO: Fix use of act()
  jest.spyOn(global.console, 'error').mockImplementation();
});

beforeEach(() => {
  client.executeQuery.mockClear();
  state = undefined;
  execute = undefined;
});

describe('on initial useEffect', () => {
  it('initialises default state', () => {
    renderer.create(<QueryUser {...props} />);
    expect(state).toMatchSnapshot();
  });

  it('executes subscription', () => {
    renderer.create(<QueryUser {...props} />);
    expect(client.executeQuery).toBeCalledTimes(1);
  });

  it('passes query and vars to executeQuery', () => {
    renderer.create(<QueryUser {...props} />);

    expect(client.executeQuery).toBeCalledWith(
      {
        key: expect.any(Number),
        query: expect.any(Object),
        variables: props.variables,
      },
      expect.objectContaining({
        requestPolicy: undefined,
      })
    );
  });
});

describe('on subscription', () => {
  it('sets fetching to true', () => {
    const wrapper = renderer.create(<QueryUser {...props} />);
    wrapper.update(<QueryUser {...props} />);
    expect(state).toHaveProperty('fetching', true);
  });
});

describe('on subscription update', () => {
  it('forwards data response', done => {
    const wrapper = renderer.create(<QueryUser {...props} />);
    /**
     * Have to call update (without changes) in order to see the
     * result of the state change.
     */
    wrapper.update(<QueryUser {...props} />);

    setTimeout(() => {
      wrapper.update(<QueryUser {...props} />);
      expect(state).toHaveProperty('data', 0);
      done();
    }, 400);
  });

  it('forwards error response', done => {
    const wrapper = renderer.create(<QueryUser {...props} />);
    /**
     * Have to call update (without changes) in order to see the
     * result of the state change.
     */
    wrapper.update(<QueryUser {...props} />);

    setTimeout(() => {
      wrapper.update(<QueryUser {...props} />);
      expect(state).toHaveProperty('error', 1);
      done();
    }, 400);
  });

  it('forwards extensions response', done => {
    const wrapper = renderer.create(<QueryUser {...props} />);
    /**
     * Have to call update (without changes) in order to see the
     * result of the state change.
     */
    wrapper.update(<QueryUser {...props} />);

    setTimeout(() => {
      wrapper.update(<QueryUser {...props} />);
      expect(state).toHaveProperty('extensions', { i: 1 });
      done();
    }, 400);
  });

  it('sets fetching to false', done => {
    const wrapper = renderer.create(<QueryUser {...props} />);
    /**
     * Have to call update (without changes) in order to see the
     * result of the state change.
     */
    wrapper.update(<QueryUser {...props} />);

    setTimeout(() => {
      wrapper.update(<QueryUser {...props} />);
      expect(state).toHaveProperty('fetching', false);
      done();
    }, 400);
  });
});

describe('on change', () => {
  const q = 'query NewQuery { example }';

  it('new query executes subscription', () => {
    const wrapper = renderer.create(<QueryUser {...props} />);

    /**
     * Have to call update twice for the change to be detected.
     * Only a single change is detected (updating 5 times still only calls
     * execute subscription twice).
     */
    wrapper.update(<QueryUser {...props} query={q} />);
    wrapper.update(<QueryUser {...props} query={q} />);

    expect(client.executeQuery).toBeCalledTimes(2);
  });
});

describe('on unmount', () => {
  const start = jest.fn();
  const unsubscribe = jest.fn();

  beforeEach(() => {
    client.executeQuery.mockReturnValue(
      pipe(never, onStart(start), onEnd(unsubscribe))
    );
  });

  it('unsubscribe is called', () => {
    const wrapper = renderer.create(<QueryUser {...props} />);
    act(() => wrapper.unmount());
    expect(start).toHaveBeenCalled();
    expect(unsubscribe).toHaveBeenCalled();
  });
});

describe('execute query', () => {
  it('triggers query execution', () => {
    renderer.create(<QueryUser {...props} />);
    act(() => execute && execute());
    expect(client.executeQuery).toBeCalledTimes(2);
  });
});

describe('pause', () => {
  it('skips executing the query if pause is true', () => {
    renderer.create(<QueryUser {...props} pause={true} />);
    expect(client.executeQuery).not.toBeCalled();
  });

  it('skips executing queries if pause updates to true', () => {
    const wrapper = renderer.create(<QueryUser {...props} />);

    /**
     * Call update twice for the change to be detected.
     */
    wrapper.update(<QueryUser {...props} pause={true} />);
    wrapper.update(<QueryUser {...props} pause={true} />);
    expect(client.executeQuery).toBeCalledTimes(1);
  });
});

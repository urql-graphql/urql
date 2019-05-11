// Note: Testing for hooks is not yet supported in Enzyme - https://github.com/airbnb/enzyme/issues/2011
jest.mock('../client', () => {
  const d = { data: 1234, error: 5678 };
  const { map, interval, pipe } = require('wonka');
  const mock = {
    executeQuery: jest.fn(() =>
      pipe(
        interval(400),
        map(i => ({ data: i, error: i + 1 }))
      )
    ),
  };

  return {
    createClient: () => mock,
    data: d,
  };
});

import React, { FC } from 'react';
import renderer, { act } from 'react-test-renderer';
import { createClient } from '../client';
import { OperationContext } from '../types';
import { useQuery, UseQueryArgs, UseQueryState } from './useQuery';

// @ts-ignore
const client = createClient() as { executeQuery: jest.Mock };
const props: UseQueryArgs<{ myVar: number }> = {
  query: '{ example }',
  variables: {
    myVar: 1234,
  },
  skip: false,
};

let state: UseQueryState<any> | undefined;
let execute: ((opts?: Partial<OperationContext>) => void) | undefined;

const QueryUser: FC<UseQueryArgs<{ myVar: number }>> = ({
  query,
  variables,
  skip,
}) => {
  const [s, e] = useQuery({ query, variables, skip });
  state = s;
  execute = e;
  return <p>{s.data}</p>;
};

beforeAll(() => {
  // tslint:disable-next-line no-console
  console.log(
    'supressing console.error output due to react-test-renderer spam (hooks related)'
  );
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
      {
        requestPolicy: undefined,
      }
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

describe('execute query', () => {
  it('triggers query execution', () => {
    renderer.create(<QueryUser {...props} />);
    act(() => execute!());
    expect(client.executeQuery).toBeCalledTimes(2);
  });
});

describe('skip', () => {
  it('skips executing the query if skip is true', () => {
    renderer.create(<QueryUser {...props} skip={true} />);
    expect(client.executeQuery).not.toBeCalled();
  });

  it('skips executing queries if skip updates to true', () => {
    const wrapper = renderer.create(<QueryUser {...props} />);

    wrapper.update(<QueryUser {...props} skip={true} />);
    expect(client.executeQuery).toBeCalledTimes(1);
  });
});

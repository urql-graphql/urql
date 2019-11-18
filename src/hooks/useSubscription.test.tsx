// Note: Testing for hooks is not yet supported in Enzyme - https://github.com/airbnb/enzyme/issues/2011
jest.mock('../client', () => {
  const d = { data: 1234, error: 5678 };
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { merge, fromValue, never } = require('wonka');
  const mock = {
    executeSubscription: jest.fn(() => merge([fromValue(d), never])),
  };

  return {
    createClient: () => mock,
    data: d,
  };
});

import React, { FC } from 'react';
import renderer, { act } from 'react-test-renderer';
import { empty } from 'wonka';
// @ts-ignore - data is imported from mock only
import { createClient, data } from '../client';
import { useSubscription, UseSubscriptionState } from './useSubscription';
import { OperationContext } from '../types';

// @ts-ignore
const client = createClient() as { executeSubscription: jest.Mock };
const query = 'subscription Example { example }';

let state: UseSubscriptionState<any> | undefined;
let execute: ((opts?: Partial<OperationContext>) => void) | undefined;

const SubscriptionUser: FC<{
  q: string;
  handler?: (prev: any, data: any) => any;
  context?: Partial<OperationContext>;
  pause?: boolean;
}> = ({ q, handler, context, pause = false }) => {
  [state, execute] = useSubscription({ query: q, context, pause }, handler);
  return <p>{state.data}</p>;
};

beforeEach(() => {
  client.executeSubscription.mockClear();
  state = undefined;
});

describe('on initial useEffect', () => {
  it('initialises default state', () => {
    renderer.create(<SubscriptionUser q={query} />);
    expect(state).toMatchSnapshot();
  });

  it('executes subscription', () => {
    renderer.create(<SubscriptionUser q={query} />);
    expect(client.executeSubscription).toBeCalledTimes(1);
  });
});

it('should support setting context in useSubscription params', () => {
  const context = { url: 'test' };
  act(() => {
    renderer.create(<SubscriptionUser q={query} context={context} />);
  });
  expect(client.executeSubscription).toBeCalledWith(
    {
      key: expect.any(Number),
      query: expect.any(Object),
      variables: {},
    },
    {
      url: 'test',
    }
  );
});

describe('on subscription', () => {
  it('forwards client response', () => {
    const wrapper = renderer.create(<SubscriptionUser q={query} />);
    /**
     * Have to call update (without changes) in order to see the
     * result of the state change.
     */
    wrapper.update(<SubscriptionUser q={query} />);
    expect(state).toEqual({
      ...data,
      extensions: undefined,
      fetching: true,
      stale: false,
    });
  });
});

it('calls handler', () => {
  const handler = jest.fn();
  const wrapper = renderer.create(
    <SubscriptionUser q={query} handler={handler} />
  );
  wrapper.update(<SubscriptionUser q={query} handler={handler} />);
  expect(handler).toBeCalledTimes(1);
  expect(handler).toBeCalledWith(undefined, 1234);
});

describe('active teardown', () => {
  it('sets fetching to false when the source ends', () => {
    client.executeSubscription.mockReturnValueOnce(empty);
    renderer.create(<SubscriptionUser q={query} />);
    expect(client.executeSubscription).toHaveBeenCalled();
    expect(state).toMatchObject({ fetching: false });
  });
});

describe('execute subscription', () => {
  it('triggers subscription execution', () => {
    renderer.create(<SubscriptionUser q={query} />);
    act(() => execute && execute());
    expect(client.executeSubscription).toBeCalledTimes(2);
  });
});

describe('pause', () => {
  const props = { q: query };

  it('skips executing the query if pause is true', () => {
    renderer.create(<SubscriptionUser {...props} pause={true} />);
    expect(client.executeSubscription).not.toBeCalled();
  });

  it('skips executing queries if pause updates to true', () => {
    const wrapper = renderer.create(<SubscriptionUser {...props} />);

    wrapper.update(<SubscriptionUser {...props} pause={true} />);
    wrapper.update(<SubscriptionUser {...props} pause={true} />);
    expect(client.executeSubscription).toBeCalledTimes(1);
    expect(state).toMatchObject({ fetching: false });
  });
});

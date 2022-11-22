/* eslint-disable react-hooks/rules-of-hooks */

// Note: Testing for hooks is not yet supported in Enzyme - https://github.com/airbnb/enzyme/issues/2011
vi.mock('../context', () => {
  const d = { data: 1234, error: 5678 };
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { merge, fromValue, never } = require('wonka');
  const mock = {
    executeSubscription: vi.fn(() => merge([fromValue(d), never])),
  };

  return {
    useClient: () => mock,
  };
});

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { OperationContext } from '@urql/core';

import { useSubscription, UseSubscriptionState } from './useSubscription';
import { useClient } from '../context';

// @ts-ignore
const client = useClient() as { executeSubscription: vi.Mock };
const query = 'subscription Example { example }';

let state: UseSubscriptionState<any> | undefined;
let execute: ((opts?: Partial<OperationContext>) => void) | undefined;

const SubscriptionUser = ({
  q,
  handler,
  context,
  pause = false,
}: {
  q: string;
  handler?: (prev: any, data: any) => any;
  context?: Partial<OperationContext>;
  pause?: boolean;
}) => {
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

it('calls handler', () => {
  const handler = vi.fn();
  const wrapper = renderer.create(
    <SubscriptionUser q={query} handler={handler} />
  );
  wrapper.update(<SubscriptionUser q={query} handler={handler} />);
  expect(handler).toBeCalledWith(undefined, 1234);
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

import React from 'react';
import { shallow, mount } from 'enzyme';
import { UrqlClient } from './client';
import { queryGql as query, mutationGql, subscriptionGql } from '../test-utils';

const children = jest.fn().mockReturnValue(<h1>This is a child component</h1>);
const clientInstance = {
  executeQuery: jest.fn(),
  executeMutation: jest.fn(),
  executeSubscription: jest.fn(),
  executeUnsubscribeSubscription: jest.fn(),
  unsubscribe: jest.fn(),
};
const client = { createInstance: jest.fn().mockReturnValue(clientInstance) };
const mutations = {
  addUser: mutationGql,
  removeUser: { ...mutationGql, query: `mutation removeUser() {}` },
};

beforeEach(() => {
  children.mockClear();
  client.createInstance.mockClear();
  clientInstance.executeQuery.mockClear();
  clientInstance.executeMutation.mockClear();
  clientInstance.unsubscribe.mockClear();
  clientInstance.executeSubscription.mockClear();
  clientInstance.executeUnsubscribeSubscription.mockClear();
});

it('passes snapshot', () => {
  const wrapper = shallow(
    <UrqlClient client={client} query={query} mutations={mutations}>
      {children}
    </UrqlClient>
  );

  expect(wrapper).toMatchSnapshot();
});

describe('on creation', () => {
  it('calls createInstance', () => {
    shallow(
      <UrqlClient client={client} query={query} mutations={mutations}>
        {children}
      </UrqlClient>
    );

    expect(client.createInstance).toBeCalled();
  });

  it('throws an error if subscriptions are passed without an updateSubscription prop', () => {
    expect(() =>
      shallow(
        <UrqlClient client={client} subscriptions={[]} children={children} />
      )
    ).toThrow();
  });

  describe('defaults', () => {
    it('passes snapshot', () => {
      shallow(
        <UrqlClient client={client} query={query} mutations={mutations}>
          {children}
        </UrqlClient>
      );

      expect(children.mock.calls).toMatchSnapshot();
    });

    it('fetching = true', () => {
      shallow(
        <UrqlClient client={client} query={query} mutations={mutations}>
          {children}
        </UrqlClient>
      );

      expect(children).toBeCalledWith(
        expect.objectContaining({ fetching: true })
      );
    });

    it('error = undefined', () => {
      shallow(
        <UrqlClient client={client} query={query} mutations={mutations}>
          {children}
        </UrqlClient>
      );

      expect(children).toBeCalledWith(
        expect.objectContaining({ error: undefined })
      );
    });

    it('data = undefined', () => {
      shallow(
        <UrqlClient client={client} query={query} mutations={mutations}>
          {children}
        </UrqlClient>
      );

      expect(children).toBeCalledWith(
        expect.objectContaining({ data: undefined })
      );
    });

    it('mutations = <object>', () => {
      shallow(
        <UrqlClient client={client} query={query} mutations={mutations}>
          {children}
        </UrqlClient>
      );

      expect(typeof children.mock.calls[0][0].mutations).toBe('object');
    });
  });
});

describe('componentDidMount', () => {
  it('calls executeQuery with query object', () => {
    shallow(
      <UrqlClient client={client} query={query}>
        {children}
      </UrqlClient>
    );

    expect(clientInstance.executeQuery).toBeCalledWith(query);
  });

  it('calls executeSubscription for each subscription it has', () => {
    const subscriptions = [subscriptionGql, subscriptionGql];

    shallow(
      <UrqlClient
        client={client}
        query={query}
        subscriptions={subscriptions}
        updateSubscription={jest.fn()}
      >
        {children}
      </UrqlClient>
    );

    expect(clientInstance.executeSubscription).toBeCalledTimes(
      subscriptions.length
    );
  });
});

describe('componentDidUpdate', () => {
  it('query is refetched', () => {
    const wrapper = mount(
      <UrqlClient client={client} query={query}>
        {children}
      </UrqlClient>
    );

    const newQuery = { ...query, variables: { age: 40 } };

    children.mockClear();
    wrapper.setProps({ query: newQuery });
    expect(clientInstance.executeQuery).toBeCalledWith(newQuery);
  });

  it('mutation functions are updated', () => {
    const wrapper = mount(
      <UrqlClient client={client} query={query} mutations={mutations}>
        {children}
      </UrqlClient>
    );

    const newMutations = {
      newKey: {},
    };

    children.mockClear();
    wrapper.setProps({ mutations: newMutations });

    expect(Object.keys(children.mock.calls[1][0].mutations)).toEqual(
      Object.keys(newMutations)
    );
  });

  it('subscriptions are unsubscribed, and new ones are subscribed', () => {
    const subscriptions = [subscriptionGql, subscriptionGql];
    const wrapper = mount(
      <UrqlClient
        client={client}
        subscriptions={subscriptions}
        updateSubscription={jest.fn()}
      >
        {children}
      </UrqlClient>
    );

    // remove mock calls from mounting to get predictable test results.
    clientInstance.executeSubscription.mockClear();
    clientInstance.executeUnsubscribeSubscription.mockClear();

    const newSubscriptions = [subscriptionGql];

    wrapper.setProps({ subscriptions: newSubscriptions });

    expect(clientInstance.executeUnsubscribeSubscription).toBeCalledTimes(2);
    expect(clientInstance.executeSubscription).toBeCalledTimes(1);
  });
});

describe('componentWillUnmount', () => {
  it('unsubscribes from client lib', () => {
    const wrapper = shallow(
      <UrqlClient client={client} query={query}>
        {children}
      </UrqlClient>
    );

    wrapper.instance().componentWillUnmount();
    expect(clientInstance.unsubscribe).toBeCalled();
  });

  it('unsubscribes from subscriptions', () => {
    const wrapper = shallow(
      <UrqlClient
        client={client}
        subscriptions={[subscriptionGql]}
        updateSubscription={jest.fn()}
      >
        {children}
      </UrqlClient>
    );

    wrapper.instance().componentWillUnmount();
    expect(clientInstance.executeUnsubscribeSubscription).toBeCalledTimes(1);
  });
});

describe('mutation functions', () => {
  it('have same properties as mutation argument', () => {
    const wrapper = shallow(
      <UrqlClient client={client} query={query} mutations={mutations}>
        {children}
      </UrqlClient>
    );

    expect(Object.keys(children.mock.calls[0][0].mutations)).toEqual(
      Object.keys(mutations)
    );
  });

  it('calls executeMutation', () => {
    const wrapper = shallow(
      <UrqlClient client={client} query={query} mutations={mutations}>
        {children}
      </UrqlClient>
    );

    const addUser = children.mock.calls[0][0].mutations.addUser;
    addUser();

    expect(clientInstance.executeMutation).toBeCalled();
  });

  it('passes mutation query to executeMutation', () => {
    const wrapper = shallow(
      <UrqlClient client={client} query={query} mutations={mutations}>
        {children}
      </UrqlClient>
    );

    const removeUser = children.mock.calls[0][0].mutations.removeUser;
    removeUser();

    expect(clientInstance.executeMutation).toBeCalledWith(
      expect.objectContaining({ query: mutations.removeUser.query })
    );
  });

  it('passes mutation vars to executeMutation', () => {
    const wrapper = shallow(
      <UrqlClient client={client} query={query} mutations={mutations}>
        {children}
      </UrqlClient>
    );

    const removeUser = children.mock.calls[0][0].mutations.removeUser;
    const vars = { name: 'Stefano' };
    removeUser(vars);

    expect(clientInstance.executeMutation).toBeCalledWith(
      expect.objectContaining({ variables: vars })
    );
  });
});

describe('on change from client', () => {
  it('child components are updated', () => {
    const wrapper = shallow(
      <UrqlClient client={client} query={query} mutations={mutations}>
        {children}
      </UrqlClient>
    );

    const update = {
      fetching: false,
      data: { alert: 'all done' },
      error: { type: 'unimportant' },
    };

    const updateFun = client.createInstance.mock.calls[0][0].onChange;

    children.mockClear();
    updateFun(update);

    expect(children).toBeCalledWith(expect.objectContaining(update));
  });
});

describe('on subscription change', () => {
  it('delegates changes to the updateSubscription prop', () => {
    const NOT_STATE_VALUE = 'NOT_STATE_VALUE';
    const STATE_VALUE = 'STATE_VALUE';

    const updateSubscription = (type, state, data) => {
      if (type === 'test') {
        state = data;
      }

      return state;
    };

    const wrapper = shallow(
      <UrqlClient client={client} updateSubscription={updateSubscription}>
        {children}
      </UrqlClient>
    );

    // this data shape would not hit the state assignment in our updateSubscription updator
    // so we assert that it didn't get set.
    // @ts-ignore
    wrapper.instance().onSubscriptionStreamUpdate({
      data: {
        nottest: NOT_STATE_VALUE,
      },
    });

    expect(wrapper.state('data')).not.toBe(NOT_STATE_VALUE);

    // @ts-ignore
    wrapper.instance().onSubscriptionStreamUpdate({
      data: {
        test: STATE_VALUE,
      },
    });

    expect(wrapper.state('data')).toBe(STATE_VALUE);
  });
});

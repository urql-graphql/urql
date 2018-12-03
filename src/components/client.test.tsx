import React from 'react';
import { shallow, mount } from 'enzyme';
import { UrqlClient } from './client';
import { queryGql as query, mutationGql } from '../test-utils';

const children = jest.fn().mockReturnValue(<h1>This is a child component</h1>);
const clientInstance = {
  executeQuery: jest.fn(),
  executeMutation: jest.fn(),
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
});

it('passes snapshot', () => {
  const wrapper = shallow(
    // @ts-ignore
    <UrqlClient client={client} query={query} mutations={mutations}>
      {children}
    </UrqlClient>
  );

  expect(wrapper).toMatchSnapshot();
});

describe('on creation', () => {
  it('calls createInstance', () => {
    shallow(
      // @ts-ignore
      <UrqlClient client={client} query={query} mutations={mutations}>
        {children}
      </UrqlClient>
    );

    expect(client.createInstance).toBeCalled();
  });

  describe('defaults', () => {
    it('passes snapshot', () => {
      shallow(
        // @ts-ignore
        <UrqlClient client={client} query={query} mutations={mutations}>
          {children}
        </UrqlClient>
      );

      expect(children.mock.calls).toMatchSnapshot();
    });

    it('fetching = true', () => {
      shallow(
        // @ts-ignore
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
        // @ts-ignore
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
        // @ts-ignore
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
        // @ts-ignore
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
    const wrapper = shallow(
      // @ts-ignore
      <UrqlClient client={client} query={query}>
        {children}
      </UrqlClient>
    );

    wrapper.instance().componentDidMount();
    expect(clientInstance.executeQuery).toBeCalledWith(query);
  });
});

describe('componentDidUpdate', () => {
  it('query is refetched', () => {
    const wrapper = mount(
      // @ts-ignore
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
      // @ts-ignore
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
});

describe('componentWillUnmount', () => {
  it('unsubscribes from client lib', () => {
    const wrapper = shallow(
      // @ts-ignore
      <UrqlClient client={client} query={query}>
        {children}
      </UrqlClient>
    );

    wrapper.instance().componentWillUnmount();
    expect(clientInstance.unsubscribe).toBeCalled();
  });
});

describe('mutation functions', () => {
  it('have same properties as mutation argument', () => {
    const wrapper = shallow(
      // @ts-ignore
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
      // @ts-ignore
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
      // @ts-ignore
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
      // @ts-ignore
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
      // @ts-ignore
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

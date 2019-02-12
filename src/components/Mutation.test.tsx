jest.mock('../context', () => {
  const c = {
    executeMutation: jest.fn(),
  };

  return {
    client: c,
    Consumer: (p: any) => p.children(client),
  };
});

import { mount } from 'enzyme';
import React from 'react';
import { fromValue } from 'wonka';
// @ts-ignore - client is exclusively from mock
import { client } from '../context';
import { Mutation } from './Mutation';

const props = {
  query: 'examplequery',
};
let childProps: any;

const childMock = (c: any) => {
  childProps = c;
  return null;
};
let activeWrapper: any;
const mountWrapper = p => {
  activeWrapper = mount(<Mutation {...p} children={childMock} />);
  return activeWrapper;
};

beforeEach(() => {
  client.executeMutation.mockClear();
  childProps = undefined;
});

afterEach(() => {
  if (activeWrapper !== undefined) {
    activeWrapper.unmount();
  }
});

describe('on init', () => {
  it('default values match snapshot', () => {
    mountWrapper(props);
    expect(childProps).toMatchSnapshot();
  });
});

describe('execute mutation', () => {
  it('calls executeMutation', () => {
    mountWrapper(props);
    childProps.executeMutation();
    expect(client.executeMutation).toBeCalledTimes(1);
  });

  it('calls executeMutation with query', () => {
    mountWrapper(props);
    childProps.executeMutation();
    expect(client.executeMutation.mock.calls[0][0]).toHaveProperty(
      'query',
      props.query
    );
  });

  it('calls executeMutation with variables', () => {
    const vars = { test: 1234 };
    mountWrapper(props);
    childProps.executeMutation(vars);
    expect(client.executeMutation.mock.calls[0][0]).toHaveProperty(
      'variables',
      vars
    );
  });
});

describe('on execute', () => {
  it('sets fetching to true', () => {
    client.executeMutation.mockReturnValue(new Promise(() => undefined));

    mountWrapper(props);
    childProps.executeMutation();

    expect(childProps.fetching).toBe(true);
  });

  it('returns data from client', done => {
    const data = 1234;
    client.executeMutation.mockReturnValue(
      fromValue({ data, error: undefined })
    );

    mountWrapper(props);
    childProps.executeMutation();

    // This should be synchronous...
    setTimeout(() => {
      expect(childProps.data).toBe(data);
      done();
    }, 300);
  });

  it('returns error from client', done => {
    const error = Error('Error here');
    client.executeMutation.mockReturnValue(
      fromValue({ data: undefined, error })
    );

    mountWrapper(props);
    childProps.executeMutation();

    // This should be synchronous...
    setTimeout(() => {
      expect(childProps.error).toBe(error);
      done();
    }, 300);
  });
});

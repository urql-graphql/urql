jest.mock('./context', () => {
  const c = {
    executeQuery: jest.fn(),
  };

  return {
    client: c,
    Consumer: (p: any) => p.children(client),
  };
});

import { mount, shallow } from 'enzyme';
import React from 'react';
import { delay, fromValue, pipe } from 'wonka';
// @ts-ignore - client is exclusively from mock
import { client } from './context';
import { Query } from './Query';

const props = {
  query: 'examplequery',
};
let childProps: any;

const childMock = (c: any) => {
  childProps = c;
  return <h1>mock</h1>;
};
const mountWrapper = (p, isShallow = false) => {
  if (isShallow) {
    return shallow(<Query {...p} children={childMock} />);
  }

  const w = mount(<Query {...p} children={childMock} />);
  return w;
};

beforeEach(() => {
  client.executeQuery.mockClear();
  childProps = undefined;
});

describe('on init', () => {
  beforeEach(() => {
    client.executeQuery.mockReturnValue(fromValue({ data: 1234 }));
  });

  it('default values match snapshot', () => {
    mountWrapper(props);
    expect(childProps).toMatchSnapshot();
  });

  it('calls executeQuery', () => {
    mountWrapper(props);
    expect(client.executeQuery).toBeCalledTimes(1);
  });
});

describe('on change', () => {
  beforeEach(() => {
    client.executeQuery.mockReturnValue(fromValue({ data: 1234 }));
  });

  it('executes new query', () => {
    const wrapper = mountWrapper(props);

    // @ts-ignore
    wrapper.setProps({ ...props, query: 'new query' });
    expect(client.executeQuery).toBeCalledTimes(2);
  });
});

describe('on fetch', () => {
  beforeAll(() => {
    client.executeQuery.mockReturnValue(
      pipe(
        fromValue({ data: 1234 }),
        delay(1234)
      )
    );
  });

  it('sets fetching to true', () => {
    mountWrapper(props);
    expect(childProps).toHaveProperty('fetching', true);
  });
});

describe('on data', () => {
  const data = 12345;

  beforeAll(() => {
    client.executeQuery.mockReturnValue(fromValue({ data }));
  });

  it('returns data', () => {
    mountWrapper(props);
    expect(childProps).toHaveProperty('data', data);
  });
});

describe('on error', () => {
  const error = Error('error here');

  beforeAll(() => {
    client.executeQuery.mockReturnValue(fromValue({ error }));
  });

  it('returns error', () => {
    mountWrapper(props);
    expect(childProps).toHaveProperty('error', error);
  });
});

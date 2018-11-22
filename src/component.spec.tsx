/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { shallow } from 'enzyme';
import { UrqlContext } from './component';
import {
  queryGql,
  mutationGql,
  mutationResponse,
  queryResponse,
} from './util/samples';

const fetch = (global as any).fetch as jest.Mock;
const requestOptions = { url: 'http://localhost/graphql' };

jest.useFakeTimers();

beforeEach(() => {
  fetch.mockClear();
});

describe('onComponentDidMount', () => {
  const json = jest.fn().mockResolvedValue(queryResponse);

  beforeEach(() => {
    fetch.mockClear();
    fetch.mockReturnValue(
      new Promise(resolve => setTimeout(() => resolve({ json }), 700))
    );
  });

  afterEach(() => {
    jest.advanceTimersByTime(700);
  });

  it('fetching = true', () => {
    const wrapper = shallow(
      <UrqlContext
        query={queryGql}
        mutations={{ updateUser: mutationGql }}
        requestOptions={requestOptions}
      />
    );

    const { fetching } = wrapper.find('ContextProvider').props().value as any;
    expect(fetching).toBe(true);
  });

  it('error = false', () => {
    const wrapper = shallow(
      <UrqlContext
        query={queryGql}
        mutations={{ updateUser: mutationGql }}
        requestOptions={requestOptions}
      />
    );

    const { error } = wrapper.find('ContextProvider').props().value as any;
    expect(error).toBe(false);
  });

  it('data = []', () => {
    const wrapper = shallow(
      <UrqlContext
        query={queryGql}
        mutations={{ updateUser: mutationGql }}
        requestOptions={requestOptions}
      />
    );

    const { data } = wrapper.find('ContextProvider').props().value as any;
    expect(data).toEqual([]);
  });

  it('mutations are provided', () => {
    const wrapper = shallow(
      <UrqlContext
        query={queryGql}
        mutations={{ updateUser: mutationGql }}
        requestOptions={requestOptions}
      />
    );

    const { mutate } = wrapper.find('ContextProvider').props().value as any;
    expect(mutate).toHaveProperty('updateUser');
  });

  it('fetch is called', () => {
    shallow(
      <UrqlContext
        query={queryGql}
        mutations={{ updateUser: mutationGql }}
        requestOptions={requestOptions}
      />
    );

    expect(fetch).toBeCalled();
  });
});

describe('on mutation call', () => {
  const json = jest.fn().mockResolvedValue({ json: mutationResponse });

  beforeEach(() => {
    fetch.mockClear();
    fetch.mockResolvedValue({ json });
  });

  it('calls fetch with mutation', () => {
    const wrapper = shallow(
      <UrqlContext
        query={queryGql}
        mutations={{ updateUser: mutationGql }}
        requestOptions={requestOptions}
      />
    );

    const { mutate } = wrapper.find('ContextProvider').props().value as any;
    mutate.updateUser();

    expect(JSON.parse(fetch.mock.calls[1][1].body).variables).toEqual(
      mutationGql.variables
    );
  });

  it('refetches query after mutation', () => {
    const wrapper = shallow(
      <UrqlContext
        query={queryGql}
        mutations={{ updateUser: mutationGql }}
        requestOptions={requestOptions}
      />
    );

    const { mutate } = wrapper.find('ContextProvider').props().value as any;
    mutate.updateUser();

    expect(JSON.parse(fetch.mock.calls[2][1].body).variables).toEqual(
      queryGql.variables
    );
  });
});

describe('on query call', () => {
  const response = { json: jest.fn().mockResolvedValue(queryResponse) };

  beforeAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    fetch.mockClear();
    fetch.mockResolvedValue(response);
  });

  it('fetched data is added to context', done => {
    const wrapper = shallow(
      <UrqlContext
        query={queryGql}
        mutations={{ updateUser: mutationGql }}
        requestOptions={requestOptions}
      />
    );

    setTimeout(() => {
      wrapper.update();
      const { data } = wrapper.find('ContextProvider').props().value as any;

      expect(data).toEqual(queryResponse);
      done();
    }, 200);
  });
});

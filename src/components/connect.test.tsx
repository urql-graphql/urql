jest.mock('./client');
import { shallow, mount } from 'enzyme';
import React from 'react';
import { Connect } from './connect';
import { queryGql, mutationGql } from '../test-utils';

const children = jest.fn().mockReturnValue(() => <h1>Child component</h1>);
const query = queryGql;
const mutations = {
  addUser: mutationGql,
};

beforeEach(() => {
  children.mockClear();
});

it('passes snapshot', () => {
  const wrapper = shallow(
    <Connect children={children} mutations={mutations} query={query} />
  );
  expect(wrapper).toMatchSnapshot();
});

it('provides context consumer', () => {
  const wrapper = shallow(<Connect children={children} />);
  expect(wrapper.find('ContextConsumer').length).toBe(1);
});

describe('UrqlClient', () => {
  it('is mounted', () => {
    const wrapper = mount(<Connect children={children} />);
    expect(wrapper.find('UrqlClient').length).toBe(1);
  });

  it('is passed children', () => {
    const wrapper = mount(<Connect children={children} />);
    expect(wrapper.find('UrqlClient').props()).toHaveProperty(
      'children',
      children
    );
  });

  it('is passed query', () => {
    const wrapper = mount(<Connect children={children} query={query} />);
    expect(wrapper.find('UrqlClient').props()).toHaveProperty('query', query);
  });

  it('is passed mutation', () => {
    const wrapper = mount(
      <Connect children={children} mutations={mutations} />
    );
    expect(wrapper.find('UrqlClient').props()).toHaveProperty(
      'mutations',
      mutations
    );
  });

  it('is passed client', () => {
    const wrapper = mount(<Connect children={children} />);
    expect(wrapper.find('UrqlClient').props()).toHaveProperty('client', {});
  });
});

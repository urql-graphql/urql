import React from 'react';
import { Provider } from './provider';
import { shallow } from 'enzyme';

const client = { stub: true };
const children = <h1>This is a child element</h1>;

it('passes snapshot', () => {
  const wrapper = shallow(
    // @ts-ignore
    <Provider client={client}>{children}</Provider>
  );

  expect(wrapper).toMatchSnapshot();
});

it('mounts ContextProvider', () => {
  const wrapper = shallow(
    // @ts-ignore
    <Provider client={client}>{children}</Provider>
  );

  expect(wrapper.find('ContextProvider').length).toBe(1);
});

it('renders children', () => {
  const wrapper = shallow(
    // @ts-ignore
    <Provider client={client}>{children}</Provider>
  );

  expect(wrapper.find('h1').matchesElement(children)).toBeTruthy();
});

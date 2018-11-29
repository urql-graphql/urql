jest.mock('./connect');
import { mount } from 'enzyme';
import React from 'react';
import { Connect as ConnectMock } from './connect';
import { ConnectHOC } from './connect-hoc';
import { mutationGql, queryGql } from '../test-utils';

const Connect = ConnectMock as jest.Mock;
Connect.mockReturnValue(<div />);

const connectOpts = {
  mutation: { test: mutationGql },
  query: queryGql,
};

const TargetComponent = function() {
  return <div />;
};

beforeEach(() => {
  Connect.mockClear();
});

it('passes snapshot', () => {
  const Connected = ConnectHOC(connectOpts)(TargetComponent);
  const wrapper = mount(<Connected />);

  expect(wrapper).toMatchSnapshot();
});

it('Names connected component Connect(<ChildName>)', () => {
  const Connected = ConnectHOC(connectOpts)(TargetComponent);
  const wrapper = mount(<Connected />);

  expect(wrapper.find('Connect(TargetComponent)').length).toBe(1);
});

it('Calls Connect component', () => {
  const Connected = ConnectHOC(connectOpts)(TargetComponent);
  const wrapper = mount(<Connected />);

  expect(Connect).toBeCalled();
});

it('Calls Connect component with opts', () => {
  const Connected = ConnectHOC(connectOpts)(TargetComponent);
  mount(<Connected />);

  expect(Connect.mock.calls[0][0]).toEqual(
    expect.objectContaining(connectOpts)
  );
});

it('Calls Connect component with children', () => {
  const Connected = ConnectHOC(connectOpts)(TargetComponent);
  mount(<Connected />);

  expect(Connect.mock.calls[0][0].children.displayName).toEqual(
    'TargetComponent'
  );
});

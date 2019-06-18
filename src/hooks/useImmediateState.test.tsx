jest.mock('../utils/ssr', () => ({
  isSSR: jest.fn(),
}));
import React from 'react';
import renderer from 'react-test-renderer';
import { mocked } from 'ts-jest/utils';
import { useImmediateState } from './useImmediateState';
import { isSSR } from '../utils/ssr';

const setStateMock = jest.fn();
jest.spyOn(React, 'useState').mockImplementation(arg => [arg, setStateMock]);

let initialState: any;
let state;
let setState;

const Fixture = () => {
  const [a, b] = useImmediateState(initialState);

  state = a;
  setState = b;
  return null;
};

beforeEach(jest.clearAllMocks);

describe('in ssr', () => {
  beforeEach(() => {
    mocked(isSSR).mockReturnValue(true);
    initialState = { arg: 1234 };
  });

  it('sets initial state', () => {
    renderer.create(<Fixture />);
    expect(state).toEqual(initialState);
  });

  it('only mutates on setState call', () => {
    renderer.create(<Fixture />);
    setState({ newValue: 1234 });
    expect(setStateMock).toBeCalledTimes(0);
  });
});

describe('in browser', () => {
  beforeEach(() => {
    mocked(isSSR).mockReturnValue(false);
    initialState = { arg: 1234 };
  });

  it('sets initial state', () => {
    renderer.create(<Fixture />);
    expect(state).toEqual(initialState);
  });

  it('calls setState on update', () => {
    renderer.create(<Fixture />);
    setState({ newValue: 1234 });
    expect(setStateMock).toBeCalledTimes(1);
  });
});

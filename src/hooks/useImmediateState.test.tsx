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

const initialState = { someObject: 1234 };
const updateState = { someObject: 5678 };
let state;

const Fixture = ({ update }: { update?: boolean }) => {
  const [a, setState] = useImmediateState<object>(initialState);

  if (update) {
    setState(updateState);
  }

  state = a;

  return null;
};

beforeEach(jest.clearAllMocks);

describe('in ssr', () => {
  beforeEach(() => {
    mocked(isSSR).mockReturnValue(true);
  });

  it('sets initial state', () => {
    renderer.create(<Fixture />);
    expect(state).toEqual(initialState);
  });

  it('only mutates on setState call', () => {
    renderer.create(<Fixture update={true} />);
    expect(setStateMock).toBeCalledTimes(0);
    expect(state).toEqual(updateState);
  });
});

describe('in browser', () => {
  beforeEach(() => {
    mocked(isSSR).mockReturnValue(false);
  });

  it('sets initial state', () => {
    renderer.create(<Fixture />);
    expect(state).toEqual(initialState);
  });

  it('calls setState on update', () => {
    renderer.create(<Fixture update={true} />);
    expect(setStateMock).toBeCalledTimes(1);
  });
});

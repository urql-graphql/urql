import React from 'react';
import renderer from 'react-test-renderer';
import { useImmediateState } from './useImmediateState';

const setStateMock = jest.fn();
jest.spyOn(React, 'useState').mockImplementation(arg => [arg, setStateMock]);

const initialState = { someObject: 1234 };
const updateState = { someObject: 5678 };
let state;
let setState;
let returnVal;

const Fixture = ({ update }: { update?: boolean }) => {
  const [a, set] = useImmediateState<object>(initialState);

  if (update) {
    returnVal = set(updateState);
  }

  state = a;
  setState = set;

  return null;
};

beforeEach(jest.clearAllMocks);

describe('on initial mount', () => {
  it('sets initial state', () => {
    renderer.create(<Fixture />);
    expect(state).toEqual(initialState);
  });

  it('only mutates on setState call', () => {
    renderer.create(<Fixture update={true} />);
    expect(setStateMock).toBeCalledTimes(0);
    expect(state).toEqual(updateState);
    expect(returnVal).toBe(undefined);
  });
});

describe('on later mounts', () => {
  it('sets state via setState', () => {
    renderer.create(<Fixture />);
    setState(updateState);
    expect(setStateMock).toBeCalledTimes(1);
    expect(returnVal).toBe(undefined);
  });
});

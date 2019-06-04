import React from 'react';
import { renderHook } from 'react-hooks-testing-library';
import { useImmediateState } from './useImmediateState';

it('updates state immediately during mount', () => {
  let initialState;
  let update = 0;

  const setState = jest.fn();

  const spy = jest.spyOn(React, 'useState').mockImplementation(state => {
    expect(state).toEqual({ x: 'x', test: false });
    initialState = state;
    return [state, setState];
  });

  const { result } = renderHook(() => {
    const [state, setState] = useImmediateState({ x: 'x', test: false });
    if (update === 0) setState(s => ({ ...s, test: true }));
    update++;
    return state;
  });

  expect(setState).not.toHaveBeenCalled();
  expect(result.current).toEqual({ x: 'x', test: true });
  expect(result.current).toBe(initialState);
  expect(update).toBe(1);

  spy.mockRestore();
});

it('behaves like useState otherwise', () => {
  const setState = jest.fn();
  const spy = jest
    .spyOn(React, 'useState')
    .mockImplementation(state => [state, setState]);

  renderHook(() => {
    const [state, setState] = useImmediateState({ x: 'x' });
    React.useEffect(() => setState({ x: 'y' }), [setState]);
    return state;
  });

  expect(setState).toHaveBeenCalledTimes(1);
  spy.mockRestore();
});

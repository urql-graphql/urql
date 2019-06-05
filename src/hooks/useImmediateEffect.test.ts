import React from 'react';
import { renderHook, act } from 'react-hooks-testing-library';
import { useImmediateEffect } from './useImmediateEffect';

it('calls effects immediately on mount', () => {
  const spy = jest.spyOn(React, 'useEffect');
  const useEffect = jest.fn();
  const effect = jest.fn();

  spy.mockImplementation(useEffect);

  renderHook(() => {
    useImmediateEffect(effect, [effect]);
    expect(effect).toHaveBeenCalledTimes(1);
  });

  expect(effect).toHaveBeenCalledTimes(1);
  expect(useEffect).toHaveBeenCalledWith(expect.any(Function), [
    expect.any(Function),
  ]);

  spy.mockRestore();
});

it('behaves like useEffect otherwise', () => {
  const spy = jest.spyOn(React, 'useEffect');
  const effect = jest.fn();

  const { result } = renderHook(() => {
    const [ref, setState] = React.useState({});
    useImmediateEffect(effect, [ref]);

    expect(effect).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalled();

    const forceUpdate = () => setState({});
    return forceUpdate;
  });

  act(() => result.current()); // forceUpdate
  expect(effect).toHaveBeenCalledTimes(2);

  spy.mockRestore();
});

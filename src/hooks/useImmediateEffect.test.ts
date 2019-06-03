import React from 'react';
import { renderHook } from 'react-hooks-testing-library';
import { useImmediateEffect } from './useImmediateEffect';

it('calls effects immediately on mount', () => {
  const spy = jest.spyOn(React, 'useEffect');
  const useEffect = jest.fn();
  const effect = jest.fn();

  spy.mockImplementation(useEffect);
  renderHook(() => useImmediateEffect(effect, [effect]));

  expect(effect).toHaveBeenCalledTimes(1);
  expect(effect).toHaveBeenCalledTimes(1);

  expect(useEffect).toHaveBeenCalledWith(expect.any(Function), [
    expect.any(Function),
  ]);

  useEffect.mockRestore();
});

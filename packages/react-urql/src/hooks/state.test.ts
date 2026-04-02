import { it, expect, describe } from 'vitest';
import { computeNextState, initialState } from './state';

describe('computeNextState', () => {
  it('clears error when new result does not include an error key', () => {
    const prevState = { ...initialState, error: new Error('old error') };
    const result = { fetching: false };
    const newState = computeNextState(prevState, result);
    expect(newState.data).toBeUndefined();
    expect(newState.error).toBeUndefined();
    expect(newState.fetching).toBe(false);
  });

  it('preserves error when new result is still fetching', () => {
    const error = new Error('old error');
    const prevState = { ...initialState, error };
    const result = { fetching: true };
    const newState = computeNextState(prevState, result);
    expect(newState.data).toBeUndefined();
    expect(newState.error).toBe(error);
    expect(newState.fetching).toBe(true);
  });

  it('sets error when new result has an error', () => {
    const error = new Error('something went wrong');
    const result = { fetching: false, error };
    const newState = computeNextState(initialState, result as any);
    expect(newState.data).toBeUndefined();
    expect(newState.error).toBe(error);
    expect(newState.fetching).toBe(false);
  });

  it('preserves data when result has no data and no error', () => {
    const data = { foo: 1 };
    const prevState = { ...initialState, data };
    const result = { fetching: false };
    const newState = computeNextState(prevState, result);
    expect(newState.data).toBe(data);
    expect(newState.error).toBeUndefined();
    expect(newState.fetching).toBe(false);
  });
});

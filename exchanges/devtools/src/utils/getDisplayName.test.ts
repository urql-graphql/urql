import { getDisplayName } from './getDisplayName';
import { describe, it, expect } from 'vitest';

const MyComponent = fn => fn();

const useQuery = () => getDisplayName();
const useMutation = () => getDisplayName();
const useSubscription = () => getDisplayName();
const useUnsupportedFunction = () => getDisplayName();

describe('on useQuery', () => {
  it('returns derives component name', () => {
    expect(MyComponent(useQuery)).toEqual('MyComponent');
  });
});

describe('on useMutation', () => {
  it('returns derives component name', () => {
    expect(MyComponent(useMutation)).toEqual('MyComponent');
  });
});

describe('on useSubscription', () => {
  it('returns derives component name', () => {
    expect(MyComponent(useSubscription)).toEqual('MyComponent');
  });
});

describe('on useUnknownFunction', () => {
  it('returns "Unknown"', () => {
    expect(MyComponent(useUnsupportedFunction)).toEqual('Unknown');
  });
});

describe('on no component in stack trace', () => {
  it('returns "Unknown"', () => {
    expect(getDisplayName()).toEqual('Unknown');
  });
});

import { h } from 'preact';
import { render } from '@testing-library/preact';
import { useImmediateState } from './useImmediateState';

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
    render(
      // @ts-ignore
      h(Fixture, {})
    );
    expect(state).toEqual(initialState);
  });

  it('only mutates on setState call', () => {
    render(
      // @ts-ignore
      h(Fixture, { update: true })
    );
    expect(state).toEqual(updateState);
    expect(returnVal).toBe(undefined);
  });
});

describe('on later mounts', () => {
  it('sets state via setState', () => {
    render(
      // @ts-ignore
      h(Fixture, {})
    );
    setState(updateState);
    expect(returnVal).toBe(undefined);
  });
});

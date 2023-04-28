import * as React from 'react';

export const initialState = {
  fetching: false,
  stale: false,
  error: undefined,
  data: undefined,
  extensions: undefined,
  operation: undefined,
};

/**
 * Checks if two objects are shallowly different with a special case for
 * 'operation' where it compares the key if they are not the otherwise equal
 */
const isShallowDifferent = <T extends Record<string, any>>(a: T, b: T) => {
  for (const key in a) if (!(key in b)) return true;
  for (const key in b) {
    if (a[key] !== b[key]) {
      // Two operations are considered equal if they have the same key
      if (key === 'operation' && a.operation?.key === b.operation?.key) {
        continue;
      }
      return true;
    }
  }
  return false;
};

interface Stateish {
  data?: any;
  error?: any;
  fetching: boolean;
  stale: boolean;
}

export const computeNextState = <T extends Stateish>(
  prevState: T,
  result: Partial<T>
): T => {
  const newState: T = {
    ...prevState,
    ...result,
    data:
      result.data !== undefined || result.error ? result.data : prevState.data,
    fetching: !!result.fetching,
    stale: !!result.stale,
  };

  return isShallowDifferent(prevState, newState) ? newState : prevState;
};

export const hasDepsChanged = <T extends { length: number }>(a: T, b: T) => {
  for (let i = 0, l = b.length; i < l; i++) if (a[i] !== b[i]) return true;
  return false;
};

const reactSharedInternals = (React as any)
  .__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

export function deferDispatch<Dispatch extends React.Dispatch<any>>(
  setState: Dispatch,
  value: Dispatch extends React.Dispatch<infer State> ? State : void
) {
  if (
    process.env.NODE_ENV !== 'production' &&
    !!reactSharedInternals &&
    !!reactSharedInternals.ReactCurrentOwner &&
    !!reactSharedInternals.ReactCurrentOwner.current
  ) {
    Promise.resolve(value).then(setState);
  } else {
    setState(value);
  }
}

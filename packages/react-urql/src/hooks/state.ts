export const initialState = {
  fetching: false,
  stale: false,
  error: undefined,
  data: undefined,
  extensions: undefined,
  operation: undefined,
};

const isShallowDifferent = (a: any, b: any) => {
  if (typeof a != 'object' || typeof b != 'object') return a !== b;
  for (const x in a) if (!(x in b)) return true;
  for (const x in b) if (a[x] !== b[x]) return true;
  return false;
};

interface Stateish {
  fetching: boolean;
  stale: boolean;
}

export const computeNextState = <T extends Stateish>(
  prevState: T,
  result: Partial<T>
): T => {
  const newState = {
    ...prevState,
    ...result,
    fetching: !!result.fetching,
    stale: !!result.stale,
  };

  return isShallowDifferent(prevState, newState) ? newState : prevState;
};

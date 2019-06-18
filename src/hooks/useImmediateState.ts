import { useRef, useState, useCallback } from 'react';
import { isSSR } from '../utils';

type SetStateAction<S> = S | ((prevState: S) => S);
type SetState<S> = (action: SetStateAction<S>) => void;

/**
 * This is a drop-in replacement for useState, limited to object-based state.
 * During initial mount it will mutably update the state, instead of scheduling
 * a React update using setState
 */
export const useImmediateState = <S extends {}>(init: S): [S, SetState<S>] => {
  const initialState = useRef<S>({ ...init });
  const [state, setState] = useState<S>(initialState.current);

  // This wraps setState and updates the state mutably on initial mount
  const updateState: SetState<S> = useCallback((action: SetStateAction<S>) => {
    if (isSSR()) {
      const newValue =
        typeof action === 'function'
          ? (action as (arg: S) => S)(initialState.current)
          : action;
      return Object.assign(initialState.current, newValue);
    }

    setState(action);
  }, []);

  return [state, updateState];
};

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
} from 'react';

type SetStateAction<S> = S | ((prevState: S) => S);
type SetState<S> = (action: SetStateAction<S>) => void;

// See https://github.com/reduxjs/react-redux/blob/316467a/src/hooks/useSelector.js#L6-L15
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * This is a drop-in replacement for useState, limited to object-based state.
 * During initial mount it will mutably update the state, instead of scheduling
 * a React update using setState
 */
export const useImmediateState = <S extends {}>(init: S): [S, SetState<S>] => {
  const isMounted = useRef(false);
  const [state, setState] = useState<S>(init);

  // This wraps setState and updates the state mutably on initial mount
  const updateState: SetState<S> = useCallback(
    (action: SetStateAction<S>): void => {
      if (!isMounted.current) {
        const newState =
          typeof action === 'function'
            ? (action as (arg: S) => S)(state)
            : action;
        Object.assign(state, newState);
      } else {
        setState(action);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useIsomorphicLayoutEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return [state, updateState];
};

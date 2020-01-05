import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
} from 'preact/hooks';

type SetStateAction<S> = S | ((prevState: S) => S);
type SetState<S> = (action: SetStateAction<S>) => void;

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

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

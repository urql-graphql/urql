import { useRef, useEffect, useState, useCallback } from 'react';

type SetStateAction<S> = S | ((prevState: S) => S);
type SetState<S> = (action: SetStateAction<S>) => void;

export const useImmediateState = <S extends {}>(init: S): [S, SetState<S>] => {
  const isMounted = useRef(false);
  const initialState = useRef<S>({ ...init });
  const [state, setState] = useState<S>(initialState.current);

  const updateState: SetState<S> = useCallback((action: SetStateAction<S>) => {
    // If the component is currently before its initial mount, update
    // the state immediately
    if (isMounted.current) {
      setState(action);
    } else if (typeof action === 'function') {
      const update = (action as any)(initialState.current);
      Object.assign(initialState.current, update);
    } else {
      Object.assign(initialState.current, action as any);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return [state, updateState];
};

import { useRef, useEffect, useCallback } from 'react';

enum LifecycleState {
  WillMount = 0,
  DidMount = 1,
  Update = 2,
}

type Effect = () => void | (() => void);

/** This executes an effect immediately on initial render and then treats it as a normal effect */
export const useImmediateEffect = (
  effect: Effect,
  changes: ReadonlyArray<any>
) => {
  const state = useRef(LifecycleState.WillMount);
  const execute = useCallback(effect, changes);

  useEffect(() => {
    // Initially we skip executing the effect since we've already done so on
    // initial render, then we execute it as usual
    if (state.current === LifecycleState.Update) {
      return execute();
    } else {
      state.current = LifecycleState.Update;
    }
  }, [execute]);

  // On initial render we just execute the effect
  if (state.current === LifecycleState.WillMount) {
    state.current = LifecycleState.DidMount;
    execute();
  }
};

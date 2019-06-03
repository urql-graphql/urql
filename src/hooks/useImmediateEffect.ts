import { useRef, useEffect, useCallback } from 'react';
import { noop } from '../utils';

enum LifecycleState {
  WillMount = 0,
  DidMount = 1,
  Update = 2,
}

type Effect = () => () => void;

/** This executes an effect immediately on initial render and then treats it as a normal effect */
export const useImmediateEffect = (
  effect: Effect,
  changes: ReadonlyArray<any>
) => {
  const teardown = useRef(noop);
  const state = useRef(LifecycleState.WillMount);
  const execute = useCallback(effect, changes);

  // On initial render we just execute the effect
  if (state.current === LifecycleState.WillMount) {
    state.current = LifecycleState.DidMount;
    teardown.current = execute();
  }

  useEffect(() => {
    // Initially we skip executing the effect since we've already done so on
    // initial render, then we execute it as usual
    if (state.current === LifecycleState.Update) {
      return (teardown.current = execute());
    } else {
      state.current = LifecycleState.Update;
      return teardown.current;
    }
  }, [execute]);
};

/* eslint-disable react-hooks/exhaustive-deps */

import { useRef, useEffect } from 'react';
import { noop } from '../utils';

enum LifecycleState {
  WillMount = 0,
  DidMount = 1,
  Update = 2,
}

type Effect = () => () => void;

/** This is a drop-in replacement for useEffect that will execute the first effect that happens during initial mount synchronously */
export const useImmediateEffect = (
  effect: Effect,
  changes: ReadonlyArray<any>
) => {
  const teardown = useRef(noop);
  const state = useRef(LifecycleState.WillMount);

  // On initial render we just execute the effect
  if (state.current === LifecycleState.WillMount) {
    state.current = LifecycleState.DidMount;
    teardown.current = effect();
  }

  useEffect(() => {
    // Initially we skip executing the effect since we've already done so on
    // initial render, then we execute it as usual
    if (state.current === LifecycleState.Update) {
      return (teardown.current = effect());
    } else {
      state.current = LifecycleState.Update;
      return teardown.current;
    }
  }, changes);
};

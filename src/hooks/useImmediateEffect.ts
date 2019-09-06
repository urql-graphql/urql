/* eslint-disable react-hooks/exhaustive-deps */

import { useRef, useEffect, EffectCallback } from 'react';

type LifecycleState = 0 | 1;

const MOUNT = 0;
const UPDATE = 1;

/** This is a drop-in replacement for useEffect that will execute the first effect that happens during initial mount synchronously */
export const useImmediateEffect = (
  effect: EffectCallback,
  changes: ReadonlyArray<any>
) => {
  const teardown = useRef<ReturnType<EffectCallback>>(undefined);
  const state = useRef<LifecycleState>(MOUNT);

  // On initial render we just execute the effect
  if (state.current === MOUNT) {
    teardown.current = effect();
  }

  useEffect(() => {
    // Initially we skip executing the effect since we've already done so on
    // initial render, then we execute it as usual
    if (state.current === UPDATE) {
      return (teardown.current = effect());
    } else {
      state.current = UPDATE;
      return teardown.current;
    }
  }, changes);
};

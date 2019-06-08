/* eslint-disable react-hooks/exhaustive-deps */

import { useRef, useEffect, EffectCallback } from 'react';

type LifecycleState = 0 | 1 | 2;

const WILL_MOUNT = 0;
const DID_MOUNT = 1;
const UPDATE = 2;

/** This is a drop-in replacement for useEffect that will execute the first effect that happens during initial mount synchronously */
export const useImmediateEffect = (
  effect: EffectCallback,
  changes: ReadonlyArray<any>
) => {
  const teardown = useRef<ReturnType<EffectCallback>>(undefined);
  const state = useRef<LifecycleState>(WILL_MOUNT);

  // On initial render we just execute the effect
  if (state.current === WILL_MOUNT) {
    state.current = DID_MOUNT;
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

/* eslint-disable react-hooks/exhaustive-deps */

import { useRef, useEffect, EffectCallback } from 'react';

/** This is a drop-in replacement for useEffect that will execute the first effect that happens during initial mount synchronously */
export const useImmediateEffect = (
  effect: EffectCallback,
  changes: ReadonlyArray<any>
) => {
  const teardown = useRef<ReturnType<EffectCallback>>(undefined);
  const isMounted = useRef<boolean>(false);

  // On initial render we just execute the effect
  if (!isMounted.current) {
    // There's the slight possibility that we had an interrupt due to
    // conccurrent mode after running the effect.
    // This could result in memory leaks.
    if (teardown.current) teardown.current();
    teardown.current = effect();
  }

  useEffect(() => {
    // Initially we skip executing the effect since we've already done so on
    // initial render, then we execute it as usual
    if (isMounted.current) {
      return (teardown.current = effect());
    } else {
      isMounted.current = true;
      return teardown.current;
    }
  }, changes);
};

import { useRef, useEffect, EffectCallback } from 'preact/hooks';
import { noop } from './useQuery';

/** This is a drop-in replacement for useEffect that will execute the first effect that happens during initial mount synchronously */
export const useImmediateEffect = (
  effect: EffectCallback,
  changes: ReadonlyArray<any>
) => {
  const teardown = useRef<() => void>(noop);
  const isMounted = useRef<boolean>(false);

  // On initial render we just execute the effect
  if (!isMounted.current) {
    // There's the slight possibility that we had an interrupt due to
    // conccurrent mode after running the effect.
    // This could result in memory leaks.
    teardown.current();
    teardown.current = effect() || noop;
  }

  useEffect(() => {
    // Initially we skip executing the effect since we've already done so on
    // initial render, then we execute it as usual
    return isMounted.current
      ? effect()
      : ((isMounted.current = true), teardown.current);
  }, changes);
};

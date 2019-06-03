import { useRef, useEffect, useCallback } from 'react';

enum EffectState {
  BeforeMount = 0,
  AfterMount = 1,
  Render = 2,
}

type Effect = () => void | (() => void);

/** This executes an effect immediately on initial render and then treats it as a normal effect */
export const useImmediateEffect = (effect: Effect, changes?: any[]) => {
  const state = useRef(EffectState.BeforeMount);
  const execute = useCallback(effect, changes);

  useEffect(() => {
    // Initially we skip executing the effect since we've already done so on
    // initial render, then we execute it as usual
    if (state.current === EffectState.Render) {
      return execute();
    } else {
      state.current = EffectState.Render;
    }
  }, [execute]);

  // On initial render we just execute the effect
  if (state.current === EffectState.BeforeMount) {
    state.current = EffectState.AfterMount;
    execute();
  }
};

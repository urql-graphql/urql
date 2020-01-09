import { useReducer, useRef, useMemo, useEffect, useLayoutEffect } from 'react';
import { pipe, makeSubject, subscribe, Operator, Source } from 'wonka';

interface State<R, T = R> {
  active: boolean;
  output: R;
  input?: T;
}

const useIsomorphicEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

type Internals<T> = [(input: T) => void, Source<T>];

export const useSubjectValue = <T, R>(
  fn: Operator<T, R>,
  input: T,
  init: R
): [R, (value: T) => void] => {
  const state = useRef<State<R, T>>({ active: false, output: init });

  // This forces an update when the given output hasn't been stored yet
  const [, forceUpdate] = useReducer((x: number, output: R) => {
    state.current.output = output;
    return x + 1;
  }, 0);

  const [update, input$] = useMemo<Internals<T>>(() => {
    const [input$, next] = makeSubject<T>();

    // When the input has changed this causes a new update on the input stream
    const update = (input: T) => {
      if (!state.current.active) {
        // If this is called by the user, not as part of an update, then we always just update immediately
        next(input);
      } else if (!('input' in state.current) || input !== state.current.input) {
        // This is only safe in concurrent mode, because a second run wouldn't trigger another update,
        // but our effect will be updating the output regardless
        state.current.input = input;
        next(input);
      }
    };

    return [update, input$];
  }, []);

  useIsomorphicEffect(() => {
    const [unsubscribe] = pipe(fn(input$), subscribe(forceUpdate));

    return unsubscribe;
  }, []);

  useIsomorphicEffect(() => {
    state.current.active = true;
    update(input);
    state.current.active = false;
  }, [input]);

  return [state.current.output, update];
};

export const useStreamValue = <T, R>(
  fn: Operator<T, R>,
  input: T,
  init: R
): R => useSubjectValue<T, R>(fn, input, init)[0];

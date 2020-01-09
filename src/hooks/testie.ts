import { useReducer, useRef, useMemo, useEffect } from 'react';
import { pipe, makeSubject, subscribe, Operator } from 'wonka';

interface State<R, T = R> {
  active?: boolean;
  output: R;
  input?: T;
  unsubscribe?: () => void;
}

type Internals<T> = [(input: T) => void, () => void];

export const useSubjectValue = <T, R>(
  fn: Operator<T, R>,
  input: T,
  init: R
): [R, (value: T) => void] => {
  const state = useRef<State<R, T>>({ output: init });

  // This forces an update when the given output hasn't been stored yet
  const [, force] = useReducer((x: number, output: R) => {
    state.current.output = output;
    return x + 1;
  }, 0);

  const [update, unsubscribe] = useMemo<Internals<T>>(() => {
    const [input$, next] = makeSubject<T>();
    const [unsubscribe] = pipe(
      fn(input$),
      subscribe((output: R) => {
        if (!state.current.active) {
          if (state.current.unsubscribe) state.current.unsubscribe();
          force(output);
        } else {
          // The result of the input stream updates the latest output if it's an immediate result
          state.current.output = output;
        }
      })
    );

    // When the input has changed this causes a new update on the input stream
    const update = (input: T) => {
      if (!state.current.active) {
        // If this is called by the user, not as part of an update, then we always just update immediately
        next(input);
      } else if (!('input' in state.current) || input !== state.current.input) {
        // This is only safe in concurrent mode, because a second run wouldn't trigger another update,
        // but our effect will be updating the output regardless
        next((state.current.input = input));
      }
    };

    state.current.unsubscribe = unsubscribe;
    return [update, unsubscribe];
  }, [fn]);

  // Set active flag to true while updating and call it with new input
  state.current.active = true;
  update(input);
  state.current.active = false;

  // Let React call unsubscribe on unmount
  useEffect(() => unsubscribe, [unsubscribe]);

  return [state.current.output, update];
};

export const useStreamValue = <T, R>(
  fn: Operator<T, R>,
  input: T,
  init: R
): R => useSubjectValue<T, R>(fn, input, init)[0];

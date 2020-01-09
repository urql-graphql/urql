import { useReducer, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { pipe, makeSubject, subscribe, Operator } from 'wonka';
import { unstable_scheduleCallback, unstable_cancelCallback, unstable_getCurrentPriorityLevel } from 'scheduler';

interface State<R, T = R> {
  active?: boolean;
  output: R;
  input?: T;
  task?: any;
  [key: string]: any
}

const useIsoEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export const useSubjectValue = <T, R>(
  fn: Operator<T, R>,
  _input: T,
  init: R
): R => {
  const state = useRef<State<R, T>>({
    output: init,
    onValue: () => {},
    teardown: null,
    task: null,
  });

  // This forces an update when the given output hasn't been stored yet
  const [, force] = useReducer((x: number, output: R) => {
    state.current.output = output;
    return x + 1;
  }, 0);

  const sub = useCallback((shouldSchedule: boolean) => {
    const [input$] = makeSubject<T>();
    const [unsubscribe] = pipe(
      fn(input$),
      subscribe((output: R) => {
        console.log('sub', output);
        state.current.output = output;
        state.current.onValue(output);
      }),
    );
    state.current.teardown = unsubscribe;
    console.log('setting');
    if (shouldSchedule) {
      state.current.task = unstable_scheduleCallback(unstable_getCurrentPriorityLevel(), () => {
        console.log('unsub');
        if (state.current.teardown !== null) {
          state.current.teardown();
          state.current.teardown = null;
        }
      });
    }
  }, []);

  sub(true);

  useEffect(() => {
    state.current.onValue = force;
​
    if (state.current.teardown === null) {
      sub(false);
    }
​
    return () => {
      if (state.current.teardown !== null) {
        state.current.teardown();
        state.current.teardown = null;
      }
    };
  }, []);

  // Let React call unsubscribe on unmount
  useIsoEffect(() => {
    console.log('cancel cb', state.current.task);
    if (state.current.task) {
      unstable_cancelCallback(state.current.task);
    }
  }, []);

  return state.current.output;
};

export const useStreamValue = <T, R>(
  fn: Operator<T, R>,
  input: T,
  init: R
): R => useSubjectValue<T, R>(fn, input, init)[0];

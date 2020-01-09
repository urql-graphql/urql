import {
  useReducer,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from 'react';
import { pipe, makeSubject, subscribe, Operator } from 'wonka';
// eslint-disable-next-line
import {
  unstable_scheduleCallback,
  unstable_cancelCallback,
  unstable_getCurrentPriorityLevel,
} from 'scheduler';

interface State<R, T = R> {
  active?: boolean;
  output: R;
  input?: T;
  task?: any;
  [key: string]: any;
}

const useIsoEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export const useSubjectValue = <T, R>(
  fn: Operator<T, R>,
  input: T,
  init: R
): any => {
  const state = useRef<State<R, T>>({
    output: init,
    onValue: () => {},
    teardown: null,
    task: null,
    subject: makeSubject<T>(),
  });

  // This forces an update when the given output hasn't been stored yet
  const [, force] = useReducer((x: number, output: R) => {
    state.current.output = output;
    return x + 1;
  }, 0);

  const sub = useCallback(
    (shouldSchedule: boolean) => {
      const [unsubscribe] = pipe(
        fn(state.current.subject[0]),
        subscribe(o => {
          state.current.onValue(o);
        })
      );
      state.current.teardown = unsubscribe;

      if (shouldSchedule) {
        state.current.task = unstable_scheduleCallback(
          unstable_getCurrentPriorityLevel(),
          () => {
            unsubscribe();
          }
        );
      }
    },
    [fn]
  );

  if (!state.current.teardown) {
    sub(true);
    state.current.subject[1](input);
  }

  useEffect(() => {
    const isInitial = state.current.onValue !== force;
    state.current.onValue = force;
    if (state.current.teardown === null) {
      sub(false);
    }

    if (!isInitial) {
      state.current.subject[1](input);
    }
  }, [sub, input]);

  // Let React call unsubscribe on unmount
  useIsoEffect(() => {
    if (state.current.task) unstable_cancelCallback(state.current.task);
    state.current.task = null;
    return () => {
      if (state.current.teardown !== null) {
        state.current.teardown();
        state.current.teardown = null;
      }
    };
  }, []);

  return [state.current.output, state.current.subject[1]];
};

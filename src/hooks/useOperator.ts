import {
  useReducer,
  useRef,
  useEffect,
  useLayoutEffect,
  Dispatch,
} from 'react';

import { Subject, Operator, makeSubject, subscribe, pipe } from 'wonka';

import {
  CallbackNode,
  unstable_scheduleCallback as scheduleCallback,
  unstable_cancelCallback as cancelCallback,
  unstable_getCurrentPriorityLevel as getPriorityLevel,
} from 'scheduler';

interface State<R, T = R> {
  subject: Subject<T>;
  onValue: Dispatch<R>;
  teardown: null | (() => void);
  task: null | CallbackNode;
  value: R;
}

const useIsomorphicEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export const useOperator = <T, R>(
  operator: Operator<T, R>,
  input: T,
  init?: R
): [R, Dispatch<T>] => {
  const subscription = useRef<State<R, T>>({
    subject: makeSubject<T>(),
    value: init as R,
    onValue: () => {},
    teardown: null,
    task: null,
  });

  const [, setValue] = useReducer((x: number, value: R) => {
    subscription.current.value = value;
    return x + 1;
  }, 0);

  const observe = useCallback((shouldScheduleTeardown: boolean) => {
    const [unsubscribe] = pipe(
      operator(subscription.current.subject[0]),
      subscribe((value: R) => subscription.current.onValue(value))
    );

    subscription.current.teardown = unsubscribe;
    if (shouldScheduleTeardown) {
      subscription.current.task = scheduleCallback(
        getPriorityLevel(),
        unsubscribe
      );
    }
  });

  if (subscription.current.teardown === null) {
    observe(/* shouldScheduleTeardown */ true);
    subscription.current.subject[1](input);
  }

  useEffect(() => {
    const isInitial = subscription.current.onValue !== setValue;
    subscription.current.onValue = setValue;
    if (subscription.current.teardown === null) {
      observe(/* shouldScheduleTeardown */ false);
    }

    if (!isInitial) {
      subscription.current.subject[1](input);
    }
  }, [input, observe]);

  useIsomorphicEffect(() => {
    if (subscription.current.task !== null) {
      cancelCallback(subscription.current.task);
    }

    return () => {
      if (subscription.current.teardown !== null) {
        subscription.current.teardown();
      }
    };
  }, []);

  return [subscription.current.value, subscription.current.subject[1]];
};

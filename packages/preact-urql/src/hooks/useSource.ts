/* eslint-disable react-hooks/exhaustive-deps */

import { useMemo, useEffect, useState } from 'preact/hooks';

import { Source, fromValue, makeSubject, pipe, concat, subscribe } from 'wonka';

type Updater<T> = (input: T) => void;

let currentInit = false;

// Two operations are considered equal if they have the same key
const areOperationsEqual = (
  a: { key: number } | undefined,
  b: { key: number } | undefined
) => {
  return a === b || !!(a && b && a.key === b.key);
};

const isShallowDifferent = (a: any, b: any) => {
  if (typeof a != 'object' || typeof b != 'object') return a !== b;
  for (const x in a) if (!(x in b)) return true;
  for (const key in b) {
    if (
      key === 'operation'
        ? !areOperationsEqual(a[key], b[key])
        : a[key] !== b[key]
    ) {
      return true;
    }
  }
  return false;
};

export function useSource<T, R>(
  input: T,
  transform: (input$: Source<T>, initial?: R) => Source<R>
): [R, Updater<T>] {
  const [input$, updateInput] = useMemo((): [Source<T>, (value: T) => void] => {
    const subject = makeSubject<T>();
    const source = concat([fromValue(input), subject.source]);

    const updateInput = (nextInput: T) => {
      if (nextInput !== input) subject.next((input = nextInput));
    };

    return [source, updateInput];
  }, []);

  const [state, setState] = useState<R>(() => {
    currentInit = true;
    let state: R;
    try {
      pipe(
        transform(fromValue(input)),
        subscribe(value => {
          state = value;
        })
      ).unsubscribe();
    } finally {
      currentInit = false;
    }

    return state!;
  });

  useEffect(() => {
    return pipe(
      transform(input$, state),
      subscribe(value => {
        if (!currentInit) {
          setState(prevValue => {
            return isShallowDifferent(prevValue, value) ? value : prevValue;
          });
        }
      })
    ).unsubscribe;
  }, [input$ /* `state` is only an initialiser */]);

  return [state, updateInput];
}

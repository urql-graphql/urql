/* eslint-disable react-hooks/exhaustive-deps */

import { useMemo, useEffect, useState } from 'react';
import {
  Source,
  fromValue,
  makeSubject,
  takeWhile,
  pipe,
  map,
  concat,
  subscribe,
} from 'wonka';

type Updater<T> = (input: T) => void;

let currentInit = false;

const isShallowDifferent = (a: any, b: any) => {
  if (typeof a != 'object' || typeof b != 'object') return a !== b;
  for (const x in a) if (!(x in b)) return true;
  for (const x in b) if (a[x] !== b[x]) return true;
  return false;
};

export function useSource<T, R>(
  input: T,
  transform: (input$: Source<T>, initial?: R) => Source<R>
): [R, Updater<T>] {
  const [input$, updateInput] = useMemo((): [Source<T>, (value: T) => void] => {
    const subject = makeSubject<T>();
    const source = concat([
      pipe(
        fromValue(input),
        map(() => input)
      ),
      subject.source,
    ]);

    const updateInput = (nextInput: T) => {
      const prevInput = input;
      try {
        if (nextInput !== prevInput) subject.next((input = nextInput));
      } catch (error) {
        // If we suspend then React will preserve the component's state
        // which means we'll need to prepare that the next update must be
        // able to retrigger an update of the input.
        input = prevInput;
        throw error;
      }
    };

    return [source, updateInput];
  }, []);

  const [state, setState] = useState<R>(() => {
    currentInit = true;
    let state: R;
    try {
      pipe(
        transform(input$),
        takeWhile(() => currentInit),
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

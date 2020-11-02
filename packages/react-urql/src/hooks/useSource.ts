/* eslint-disable react-hooks/exhaustive-deps */

import { useMemo, useEffect, useState, useRef } from 'react';

import { Source, fromValue, makeSubject, pipe, concat, subscribe } from 'wonka';

import { useClient } from '../context';

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
  transform: (input$: Source<T>, initial: R | undefined) => Source<R>
): [R, Updater<T>] {
  const client = useClient();
  const prev = useRef<R>();

  const [input$, updateInput] = useMemo((): [Source<T>, (value: T) => void] => {
    const subject = makeSubject<T>();
    const source = concat([fromValue(input), subject.source]);

    let prevInput = input;
    const updateInput = (input: T) => {
      if (input !== prevInput) subject.next((prevInput = input));
    };

    return [source, updateInput];
  }, []);

  const [state, setState] = useState<R>(() => {
    currentInit = true;

    pipe(
      transform(fromValue(input), prev.current),
      subscribe(value => {
        prev.current = value;
      })
    ).unsubscribe();

    currentInit = false;
    return prev.current!;
  });

  useEffect(() => {
    return pipe(
      transform(input$, prev.current),
      subscribe(value => {
        if (!currentInit) {
          setState(prevValue => {
            return (prev.current = isShallowDifferent(prevValue, value)
              ? value
              : prevValue);
          });
        }
      })
    ).unsubscribe;
  }, [input$]);

  useEffect(() => {
    if (!client.suspense) updateInput(input);
  }, [updateInput, input]);

  if (client.suspense) updateInput(input);

  return [state, updateInput];
}

/* eslint-disable react-hooks/exhaustive-deps */

import { useMemo, useEffect, useState } from 'react';

import { Source, fromValue, makeSubject, pipe, concat, subscribe } from 'wonka';

import { useClient } from '../context';

type Updater<T> = (input: T) => void;

let currentInit = false;

export function useSource<T, R>(
  input: T,
  transform: (input$: Source<T>) => Source<R>
): [R, Updater<T>] {
  const client = useClient();

  const [input$, updateInput] = useMemo((): [Source<T>, (value: T) => void] => {
    const subject = makeSubject<T>();
    const source = concat([fromValue(input), subject.source]);

    let prevInput = input;
    const updateInput = (input: T) => {
      if (input !== prevInput) {
        subject.next((prevInput = input));
      }
    };

    return [source, updateInput];
  }, []);

  const [state, setState] = useState<R>(() => {
    let currentValue: R;
    currentInit = true;

    pipe(
      transform(fromValue(input)),
      subscribe(value => {
        currentValue = value;
      })
    ).unsubscribe();

    currentInit = false;
    return currentValue!;
  });

  useEffect(() => {
    pipe(
      transform(input$),
      subscribe(value => {
        if (!currentInit) {
          setState(value);
        }
      })
    );
  }, [input$]);

  useEffect(() => {
    if (!client.suspense) updateInput(input);
  }, [updateInput, input]);

  if (client.suspense) updateInput(input);

  return [state, updateInput];
}

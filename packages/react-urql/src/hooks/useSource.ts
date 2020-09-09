/* eslint-disable react-hooks/exhaustive-deps */

import { useMemo, useEffect, useState } from 'react';

import {
  Source,
  fromValue,
  makeSubject,
  pipe,
  map,
  concat,
  onPush,
  publish,
  subscribe,
} from 'wonka';

import { useClient } from '../context';

let currentInit = false;

export function useSource<T>(source: Source<T>, init: T): T {
  const [state, setState] = useState(() => {
    currentInit = true;
    let initialValue = init;

    pipe(
      source,
      onPush(value => {
        initialValue = value;
      }),
      publish
    ).unsubscribe();

    currentInit = false;
    return initialValue;
  });

  useEffect(() => {
    return pipe(
      source,
      subscribe(value => {
        if (!currentInit) {
          setState(value);
        }
      })
    ).unsubscribe as () => void;
  }, [source]);

  return state;
}

export function useBehaviourSubject<T>(value: T) {
  const client = useClient();

  const state = useMemo((): [Source<T>, (value: T) => void] => {
    let prevValue = value;

    const subject = makeSubject<T>();
    const prevValue$ = pipe(
      fromValue(value),
      map(() => prevValue)
    );

    // This turns the subject into a behaviour subject that returns
    // the last known value (or the initial value) synchronously
    const source = concat([prevValue$, subject.source]);

    const next = (value: T) => {
      // We can use the latest known value to also deduplicate next calls.
      if (value !== prevValue) {
        subject.next((prevValue = value));
      }
    };

    return [source, next];
  }, []);

  // NOTE: This is a special case for client-side suspense.
  // We can't trigger suspense inside an effect but only in the render function.
  // So we "deopt" to not using an effect if the client is in suspense-mode.
  useEffect(() => {
    if (!client.suspense) state[1](value);
  }, [state, value]);

  if (client.suspense) state[1](value);

  return state;
}

/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react-hooks/exhaustive-deps */

import { useMemo, useEffect } from 'react';
import { Subscription, Unsubscribe, useSubscription } from 'use-subscription';

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

export const useSource = <T>(source: Source<T>, init: T): T =>
  useSubscription(
    useMemo((): Subscription<T> => {
      let hasUpdate = false;
      let currentValue: T = init;

      const updateValue = pipe(
        source,
        onPush(value => {
          currentValue = value;
        })
      );

      return {
        getCurrentValue(): T {
          if (!hasUpdate) publish(updateValue).unsubscribe();
          return currentValue;
        },
        subscribe(onValue: () => void): Unsubscribe {
          hasUpdate = true;
          const { unsubscribe } = pipe(updateValue, subscribe(onValue));
          return () => {
            unsubscribe();
            hasUpdate = false;
          };
        },
      };
    }, [source])
  );

export const useBehaviourSubject = <T>(value: T) => {
  const state = useMemo((): [Source<T>, (value: T) => void] => {
    let prevValue = value;

    const subject = makeSubject<T>();
    const prevValue$ = pipe(
      fromValue(value),
      map(() => prevValue)
    );

    const source = concat([prevValue$, subject.source]);

    const next = (value: T) => {
      subject.next((prevValue = value));
    };

    return [source, next];
  }, []);

  useEffect(() => {
    state[1](value);
  }, [state, value]);

  return state;
};

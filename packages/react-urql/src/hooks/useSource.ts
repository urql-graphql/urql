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

import { useClient } from '../context';

let currentSourceId: null | {} = null;

export const useSource = <T>(source: Source<T>, init: T): T =>
  useSubscription(
    useMemo((): Subscription<T> => {
      let hasUpdate = false;
      let currentValue: T = init;
      const id = {};

      return {
        // getCurrentValue may be implemented by subscribing to the
        // given source and immediately unsubscribing. Only synchronous
        // values will therefore reach our `onPush` callback.
        getCurrentValue(): T {
          if (!hasUpdate) {
            currentSourceId = id;
            pipe(
              source,
              onPush(value => {
                currentValue = value;
              }),
              publish
            ).unsubscribe();
            currentSourceId = null;
          }

          return currentValue;
        },
        // subscribe is just a regular subscription, but it also tracks
        // `hasUpdate`. If we're subscribed and receive a new value we
        // set `hasUpdate` to avoid `getCurrentValue` trying to subscribe
        // again.
        subscribe(onValue: () => void): Unsubscribe {
          const { unsubscribe } = pipe(
            source,
            subscribe(value => {
              if (currentSourceId === null) {
                currentValue = value;
                hasUpdate = true;
                onValue();
                hasUpdate = false;
              }
            })
          );

          return () => {
            unsubscribe();
            hasUpdate = false;
          };
        },
      };
    }, [source])
  );

export const useBehaviourSubject = <T>(value: T) => {
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
};

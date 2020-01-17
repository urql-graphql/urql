import { useMemo } from 'react';
import { Subscription, Unsubscribe, useSubscription } from 'use-subscription';
import { Source, pipe, onPush, share, take, toArray, subscribe } from 'wonka';

export const useSource = <T>(source: Source<T>, init: T): T =>
  useSubscription(
    useMemo((): Subscription<T> => {
      let hasUpdate = false;
      let currentValue: T = init;

      const shared = pipe(
        source,
        onPush(value => (currentValue = value)),
        share
      );

      return {
        getCurrentValue(): T {
          if (hasUpdate) return currentValue;
          const values = pipe(shared, take(1), toArray);
          return values.length ? values[0] : currentValue;
        },
        subscribe(onValue: () => void): Unsubscribe {
          return pipe(
            shared,
            subscribe(value => {
              hasUpdate = true;
              currentValue = value;
              onValue();
              hasUpdate = false;
            })
          ).unsubscribe as Unsubscribe;
        },
      };
    }, [init, source])
  );

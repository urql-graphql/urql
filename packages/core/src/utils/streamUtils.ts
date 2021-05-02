import {
  Operator,
  Source,
  pipe,
  toPromise,
  take,
  share,
  onPush,
  onStart,
  onEnd,
  subscribe,
  make,
} from 'wonka';

import { OperationResult, PromisifiedSource } from '../types';

export function withPromise<T>(source$: Source<T>): PromisifiedSource<T> {
  (source$ as PromisifiedSource<T>).toPromise = () =>
    pipe(source$, take(1), toPromise);
  return source$ as PromisifiedSource<T>;
}

export function replayOnStart<T extends OperationResult>(
  start?: () => void
): Operator<T, T> {
  return source$ => {
    let replay: T | void;

    const shared$ = pipe(
      source$,
      onEnd(() => {
        replay = undefined;
      }),
      onPush(value => {
        replay = value;
      }),
      share
    );

    return make<T>(observer => {
      const prevReplay = replay;

      const subscription = pipe(
        shared$,
        onEnd(observer.complete),
        onStart(() => {
          if (start) start();
          if (prevReplay !== undefined && prevReplay === replay)
            observer.next({ ...prevReplay, stale: true });
        }),
        subscribe(observer.next)
      );

      return subscription.unsubscribe;
    });
  };
}

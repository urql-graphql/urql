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

export type ReplayMode = 'pre' | 'post';

export function replayOnStart<T extends OperationResult>(
  mode: ReplayMode,
  start: () => void
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

      return pipe(
        shared$,
        onEnd(observer.complete),
        onStart(() => {
          if (mode === 'pre') {
            start();
          }

          if (prevReplay !== undefined && prevReplay === replay) {
            observer.next(
              mode === 'pre' ? { ...prevReplay, stale: true } : prevReplay
            );
          } else if (mode === 'post') {
            start();
          }
        }),
        subscribe(observer.next)
      ).unsubscribe;
    });
  };
}

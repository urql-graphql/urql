import type { Readable, Writable } from 'svelte/store';
import type { OperationResult } from '@urql/core';
import { Source, make } from 'wonka';

export interface OperationResultState<Data = any, Variables = object>
  extends OperationResult<Data, Variables> {
  fetching: boolean;
}

/** A Readable containing an `OperationResult` with a fetching flag. */
export type OperationResultStore<Data = any, Variables = object> = Readable<
  OperationResultState<Data, Variables>
>;

export const fromStore = <T>(store$: Readable<T>): Source<T> =>
  make(observer => store$.subscribe(observer.next));

export const initialResult = {
  fetching: false,
  stale: false,
  error: undefined,
  data: undefined,
  extensions: undefined,
};

export interface Pausable {
  isPaused$: Writable<boolean>;
  pause(): void;
  resume(): void;
}

export const createPausable = (isPaused$: Writable<boolean>): Pausable => ({
  isPaused$,
  pause() {
    isPaused$.set(true);
  },
  resume() {
    isPaused$.set(false);
  },
});

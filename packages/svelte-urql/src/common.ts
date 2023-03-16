import type { Readable, Writable } from 'svelte/store';
import type { AnyVariables, OperationResult } from '@urql/core';
import { Source, make } from 'wonka';

export interface OperationResultState<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> extends OperationResult<Data, Variables> {
  fetching: boolean;
}

/** A Readable containing an `OperationResult` with a fetching flag. */
export type OperationResultStore<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> = Readable<OperationResultState<Data, Variables>>;

export const fromStore = <T>(store$: Readable<T>): Source<T> =>
  make(observer => store$.subscribe(observer.next));

export const initialResult = {
  operation: undefined,
  fetching: false,
  data: undefined,
  error: undefined,
  extensions: undefined,
  hasNext: false,
  stale: false,
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

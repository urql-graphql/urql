import type { Readable, Writable } from 'svelte/store';
import type { AnyVariables, OperationResult } from '@urql/core';
import { Source, make } from 'wonka';

/** An {@link OperationResult} with an added {@link OperationResultState.fetching} flag.
 *
 * @remarks
 * Stores will contain a readable state based on {@link OperationResult | OperationResults}
 * they received.
 */
export interface OperationResultState<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> extends OperationResult<Data, Variables> {
  /** Indicates whether the store is waiting for a new {@link OperationResult}.
   *
   * @remarks
   * When a store starts executing a GraphQL operation, `fetching` is
   * set to `true` until a result arrives.
   *
   * Hint: This is subtly different than whether the operation is actually
   * fetching, and doesn’t indicate whether an operation is being re-executed
   * in the background. For this, see {@link OperationResult.stale}.
   */
  fetching: boolean;
}

/** A Readable store of {@link OperationResultState}. */
export type OperationResultStore<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> = Readable<OperationResultState<Data, Variables>>;

/** Consumes a {@link Readable} as a {@link Source}.
 * @internal
 */
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

/** A pausable Svelte store.
 *
 * @remarks
 * The {@link queryStore} and {@link useSubscription} store allow
 * you to pause execution and resume it later on, which is managed
 * by a `pause` option passed to them.
 *
 * A `Pauseable` allows execution of GraphQL operations to be paused,
 * which means a {@link OperationResultStore} won’t update with new
 * results or execute new operations, and to be resumed later on.
 */
export interface Pausable {
  /** Indicates whether a store is currently paused.
   *
   * @remarks
   * When a {@link OperationResultStore} has been paused, it will stop
   * receiving updates from the {@link Client} and won’t execute GraphQL
   * operations, until this writable becomes `true` or
   * {@link Pausable.resume} is called.
   *
   * @see {@link https://urql.dev/goto/docs/basics/svelte#pausing-queries} for
   * documentation on the `Pausable`.
   */
  isPaused$: Writable<boolean>;
  /** Pauses a GraphQL operation to stop it from executing.
   *
   * @remarks
   * Pauses an {@link OperationResultStore}’s GraphQL operation, which
   * stops it from receiving updates from the {@link Client} and to stop
   * an ongoing operation.
   *
   * @see {@link https://urql.dev/goto/docs/basics/svelte#pausing-queries} for
   * documentation on the `Pausable`.
   */
  pause(): void;
  /** Resumes a paused GraphQL operation if it’s currently paused.
   *
   * @remarks
   * Resumes or starts {@link OperationResultStore}’s GraphQL operation,
   * if it’s currently paused.
   *
   * @see {@link https://urql.dev/goto/docs/basics/svelte#pausing-queries} for
   * documentation on the `Pausable`.
   */
  resume(): void;
}

/** Creates a {@link Pausable}.
 * @internal
 */
export const createPausable = (isPaused$: Writable<boolean>): Pausable => ({
  isPaused$,
  pause() {
    isPaused$.set(true);
  },
  resume() {
    isPaused$.set(false);
  },
});

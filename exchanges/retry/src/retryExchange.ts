import {
  makeSubject,
  pipe,
  merge,
  filter,
  fromValue,
  debounce,
  mergeMap,
  takeUntil,
} from 'wonka';

import type { Exchange, Operation, CombinedError } from '@urql/core';
import { makeOperation } from '@urql/core';

/** Input parameters for the {@link retryExchange}. */
export interface RetryExchangeOptions {
  /** Specify the minimum time to wait until retrying.
   *
   * @remarks
   * `initialDelayMs` specifies the minimum time (in milliseconds) to wait
   * until a failed operation is retried.
   *
   * @defaultValue `1_000` - one second
   */
  initialDelayMs?: number;
  /** Specifies the maximum time to wait until retrying.
   *
   * @remarks
   * `maxDelayMs` specifies the maximum time (in milliseconds) to wait
   * until a failed operation is retried. While `initialDelayMs`
   * specifies the minimum amount of time, `randomDelay` may cause
   * the delay to increase over multiple attempts.
   *
   * @defaultValue `15_000` - 15 seconds
   */
  maxDelayMs?: number;
  /** Enables a random exponential backoff to increase the delay over multiple retries.
   *
   * @remarks
   * `randomDelay`, unless disabled, increases the time until a failed
   * operation is retried over multiple attempts. It increases the time
   * starting at `initialDelayMs` by 1.5x with an added factor of 0–1,
   * until `maxDelayMs` is reached.
   *
   * @defaultValue `true` - enables random exponential backoff
   */
  randomDelay?: boolean;
  /** Specifies the maximum times an operation should be sent to the API.
   *
   * @remarks
   * `maxNumberAttempts` defines the number of attempts an operation should
   * be retried until it's considered failed.
   *
   * @defaultValue `2` - Retry once, i.e. two attempts
   */
  maxNumberAttempts?: number;
  /** Predicate allowing you to selectively not retry `Operation`s.
   *
   * @remarks
   * `retryIf` is called with a {@link CombinedError} and the {@link Operation} that
   * failed. If this function returns false the failed `Operation` is not retried.
   *
   * @defaultValue `(error) => !!error.networkError` - retries only on network errors.
   */
  retryIf?(error: CombinedError, operation: Operation): boolean;
  /** Transform function allowing you to selectively replace a retried `Operation` or return nullish value.
   *
   * @remarks
   * `retryWhen` is called with a {@link CombinedError} and the {@link Operation} that
   * failed. If this function returns an `Operation`, `retryExchange` will replace the
   * failed `Operation` and retry. It won't retry the `Operation` if a nullish value
   * is returned.
   *
   * The `retryIf` function, if defined, takes precedence and overrides this option.
   */
  retryWith?(
    error: CombinedError,
    operation: Operation
  ): Operation | null | undefined;
}

interface RetryState {
  count: number;
  delay: number | null;
}

/** Exchange factory that retries failed operations.
 *
 * @param options - A {@link RetriesExchangeOptions} configuration object.
 * @returns the created retry {@link Exchange}.
 *
 * @remarks
 * The `retryExchange` retries failed operations with specified delays
 * and exponential backoff.
 *
 * You may define a {@link RetryExchangeOptions.retryIf} or
 * {@link RetryExchangeOptions.retryWhen} function to only retry
 * certain kinds of operations, e.g. only queries.
 *
 * @example
 * ```ts
 * retryExchange({
 *   initialDelayMs: 1000,
 *   maxDelayMs: 15000,
 *   randomDelay: true,
 *   maxNumberAttempts: 2,
 *   retryIf: err => err && err.networkError,
 * });
 * ```
 */
export const retryExchange = (options: RetryExchangeOptions = {}): Exchange => {
  const { retryIf, retryWith } = options;
  const MIN_DELAY = options.initialDelayMs || 1000;
  const MAX_DELAY = options.maxDelayMs || 15_000;
  const MAX_ATTEMPTS = options.maxNumberAttempts || 2;
  const RANDOM_DELAY =
    options.randomDelay != null ? !!options.randomDelay : true;

  return ({ forward, dispatchDebug }) =>
    operations$ => {
      const { source: retry$, next: nextRetryOperation } =
        makeSubject<Operation>();

      const retryWithBackoff$ = pipe(
        retry$,
        mergeMap((operation: Operation) => {
          const retry: RetryState = operation.context.retry || {
            count: 0,
            delay: null,
          };

          const retryCount = ++retry.count;
          let delayAmount = retry.delay || MIN_DELAY;

          const backoffFactor = Math.random() + 1.5;
          if (RANDOM_DELAY) {
            // if randomDelay is enabled and it won't exceed the max delay, apply a random
            // amount to the delay to avoid thundering herd problem
            if (delayAmount * backoffFactor < MAX_DELAY) {
              delayAmount *= backoffFactor;
            } else {
              delayAmount = MAX_DELAY;
            }
          } else {
            // otherwise, increase the delay proportionately by the initial delay
            delayAmount = Math.min(retryCount * MIN_DELAY, MAX_DELAY);
          }

          // ensure the delay is carried over to the next context
          retry.delay = delayAmount;

          // We stop the retries if a teardown event for this operation comes in
          // But if this event comes through regularly we also stop the retries, since it's
          // basically the query retrying itself, no backoff should be added!
          const teardown$ = pipe(
            operations$,
            filter(op => {
              return (
                (op.kind === 'query' || op.kind === 'teardown') &&
                op.key === operation.key
              );
            })
          );

          dispatchDebug({
            type: 'retryAttempt',
            message: `The operation has failed and a retry has been triggered (${retryCount} / ${MAX_ATTEMPTS})`,
            operation,
            data: {
              retryCount,
              delayAmount,
            },
          });

          // Add new retryDelay and retryCount to operation
          return pipe(
            fromValue(
              makeOperation(operation.kind, operation, {
                ...operation.context,
                retry,
              })
            ),
            debounce(() => delayAmount),
            // Stop retry if a teardown comes in
            takeUntil(teardown$)
          );
        })
      );

      return pipe(
        merge([operations$, retryWithBackoff$]),
        forward,
        filter(res => {
          const retry = res.operation.context.retry as RetryState | undefined;
          // Only retry if the error passes the conditional retryIf function (if passed)
          // or if the error contains a networkError
          if (
            !res.error ||
            (retryIf
              ? !retryIf(res.error, res.operation)
              : !retryWith && !res.error.networkError)
          ) {
            // Reset the delay state for a successful operation
            if (retry) {
              retry.count = 0;
              retry.delay = null;
            }
            return true;
          }

          const maxNumberAttemptsExceeded =
            ((retry && retry.count) || 0) >= MAX_ATTEMPTS - 1;
          if (!maxNumberAttemptsExceeded) {
            const operation = retryWith
              ? retryWith(res.error, res.operation)
              : res.operation;
            if (!operation) return true;

            // Send failed responses to be retried by calling next on the retry$ subject
            // Exclude operations that have been retried more than the specified max
            nextRetryOperation(operation);
            return false;
          }

          dispatchDebug({
            type: 'retryExhausted',
            message:
              'Maximum number of retries has been reached. No further retries will be performed.',
            operation: res.operation,
          });

          return true;
        })
      );
    };
};

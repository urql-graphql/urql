import {
  makeSubject,
  share,
  pipe,
  merge,
  filter,
  fromValue,
  debounce,
  mergeMap,
  takeUntil,
} from 'wonka';
import {
  makeOperation,
  Exchange,
  Operation,
  CombinedError,
  OperationResult,
} from '@urql/core';

export interface RetryExchangeOptions {
  initialDelayMs?: number;
  maxDelayMs?: number;
  randomDelay?: boolean;
  maxNumberAttempts?: number;
  /** Conditionally determine whether an error should be retried */
  retryIf?: (error: CombinedError, operation: Operation) => boolean;
  /** Conditionally update operations as they're retried (retryIf can be replaced with this) */
  retryWith?: (
    error: CombinedError,
    operation: Operation
  ) => Operation | null | undefined;
}

export const retryExchange = ({
  initialDelayMs,
  maxDelayMs,
  randomDelay,
  maxNumberAttempts,
  retryIf,
  retryWith,
}: RetryExchangeOptions): Exchange => {
  const MIN_DELAY = initialDelayMs || 1000;
  const MAX_DELAY = maxDelayMs || 15000;
  const MAX_ATTEMPTS = maxNumberAttempts || 2;
  const RANDOM_DELAY = randomDelay || true;

  return ({ forward, dispatchDebug }) => ops$ => {
    const sharedOps$ = pipe(ops$, share);
    const {
      source: retry$,
      next: nextRetryOperation,
    } = makeSubject<Operation>();

    const retryWithBackoff$ = pipe(
      retry$,
      mergeMap((op: Operation) => {
        const { key, context } = op;
        const retryCount = (context.retryCount || 0) + 1;
        let delayAmount = context.retryDelay || MIN_DELAY;

        const backoffFactor = Math.random() + 1.5;
        // if randomDelay is enabled and it won't exceed the max delay, apply a random
        // amount to the delay to avoid thundering herd problem
        if (RANDOM_DELAY && delayAmount * backoffFactor < MAX_DELAY) {
          delayAmount *= backoffFactor;
        }

        // We stop the retries if a teardown event for this operation comes in
        // But if this event comes through regularly we also stop the retries, since it's
        // basically the query retrying itself, no backoff should be added!
        const teardown$ = pipe(
          sharedOps$,
          filter(op => {
            return (
              (op.kind === 'query' || op.kind === 'teardown') && op.key === key
            );
          })
        );

        dispatchDebug({
          type: 'retryAttempt',
          message: `The operation has failed and a retry has been triggered (${retryCount} / ${MAX_ATTEMPTS})`,
          operation: op,
          data: {
            retryCount,
          },
        });

        // Add new retryDelay and retryCount to operation
        return pipe(
          fromValue(
            makeOperation(op.kind, op, {
              ...op.context,
              retryDelay: delayAmount,
              retryCount,
            })
          ),
          debounce(() => delayAmount),
          // Stop retry if a teardown comes in
          takeUntil(teardown$)
        );
      })
    );

    const result$ = pipe(
      merge([sharedOps$, retryWithBackoff$]),
      forward,
      share,
      filter(res => {
        // Only retry if the error passes the conditional retryIf function (if passed)
        // or if the error contains a networkError
        if (
          !res.error ||
          (retryIf
            ? !retryIf(res.error, res.operation)
            : !retryWith && !res.error.networkError)
        ) {
          return true;
        }

        const maxNumberAttemptsExceeded =
          (res.operation.context.retryCount || 0) >= MAX_ATTEMPTS - 1;

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
    ) as sourceT<OperationResult>;

    return result$;
  };
};

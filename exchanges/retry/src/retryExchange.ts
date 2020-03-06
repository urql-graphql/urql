import {
  makeSubject,
  share,
  pipe,
  merge,
  filter,
  tap,
  fromValue,
  delay,
  mergeMap,
  takeUntil,
} from 'wonka';
import { Exchange, Operation, CombinedError } from '@urql/core';

interface RetryExchangeOptions {
  initialDelayMs?: number;
  maxDelayMs?: number;
  randomDelay?: boolean;
  maxNumberAttempts?: number;
  /** Conditionally determine whether an error should be retried */
  retryIf?: (e: CombinedError) => boolean;
}

export interface OperationWithRetry extends Operation {
  retryCount?: number;
}

export const retryExchange = ({
  initialDelayMs,
  maxDelayMs,
  randomDelay = true,
  maxNumberAttempts,
  retryIf,
}: RetryExchangeOptions): Exchange => {
  const MIN_DELAY = initialDelayMs || 1000;
  const MAX_DELAY = maxDelayMs || 15000;
  const MAX_ATTEMPTS = maxNumberAttempts || Infinity;

  return ({ forward }) => ops$ => {
    const sharedOps$ = pipe(ops$, share);
    const { source: retry$, next: nextRetryOperation } = makeSubject<
      OperationWithRetry
    >();

    const retryWithBackoff$ = pipe(
      retry$,
      mergeMap((op: OperationWithRetry) => {
        const { key, context } = op;
        let delayAmount = context.retryDelay || MIN_DELAY;

        const backoffFactor = Math.random() + 1.5;
        // if randomDelay is enabled and it won't exceed the max delay, apply a random
        // amount to the delay to avoid thundering herd problem
        if (randomDelay && delayAmount * backoffFactor < MAX_DELAY) {
          delayAmount *= backoffFactor;
        }

        // We stop the retries if a teardown event for this operation comes in
        // But if this event comes through regularly we also stop the retries, since it's
        // basically the query retrying itself, so no backoff should be added!
        const teardown$ = pipe(
          sharedOps$,
          filter(op => {
            return (
              (op.operationName === 'query' ||
                op.operationName === 'teardown') &&
              op.key === key
            );
          })
        );

        // Add new retryDelay and retryCount to operation
        return pipe(
          fromValue({
            ...op,
            context: {
              ...op.context,
              retryDelay: delayAmount,
            },
            retryCount: op.retryCount != null ? op.retryCount + 1 : 1,
          }),
          // Exclude operations that have been retried more than the specified max
          // or if the delayAmount is over the max accepted delay
          filter(op => op.retryCount < MAX_ATTEMPTS && delayAmount < MAX_DELAY),
          // Here's the actual delay
          delay(delayAmount),
          // Stop retry if a teardown comes in
          takeUntil(teardown$)
        );
      })
    );

    const result$ = pipe(
      merge([sharedOps$, retryWithBackoff$]),
      forward,
      share
    );

    const successResult$ = pipe(
      result$,
      // We let through all non-network-failed results
      filter(res => !res.error || !res.error.networkError)
    );

    const failedResult$ = pipe(
      result$,
      // Only retry if there was a network error and the error passes the
      // conditional retryIf function (if passed)
      filter(res => !!(res.error && (!retryIf || retryIf(res.error)))),
      // Send failed responses to be retried by calling next on the retry$ subject
      tap(op => nextRetryOperation(op.operation)),
      // Only let through the first failed response
      filter(res => !res.operation.context.retryDelay)
    );

    return merge([successResult$, failedResult$]);
  };
};

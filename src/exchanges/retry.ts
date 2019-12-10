import { Exchange, Operation } from "../";
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
  takeUntil
} from "wonka";

interface RetryExchangeOptions {
  defaultDelayMs?: number,
  maxDelayMs?: number,
}

// Random backoff factor to be used to increase the DELAY to avoid the thundering herd problem
const BACKOFF_FACTOR = Math.random() + 1.5;

export const retryExchange = (options: RetryExchangeOptions): Exchange => {
  const MIN_DELAY = options.defaultDelayMs || 1000;
  const MAX_DELAY = options.maxDelayMs || 15000;

  return ({ forward }) => ops$ => {
    const sharedOps$ = pipe(ops$, share);
    const [retry$, nextRetryOperation] = makeSubject<Operation>();

    const retryWithBackoff$ = pipe(
      retry$,
      mergeMap(op => {
        const { key, context } = op;

        let d = context.retryDelay || MIN_DELAY;
        if (d * BACKOFF_FACTOR < MAX_DELAY) {
          d *= BACKOFF_FACTOR;
        }

        // We stop the retries if a teardown event for this operation comes in
        // But if this event comes through regularly we also stop the retries, since it's
        // basically the query retrying itself, so no backoff should be added!
        const teardown$ = pipe(
          sharedOps$,
          filter(op => {
            return (
              (op.operationName === "query" || op.operationName === "teardown") &&
              op.key === key
            );
          })
        );

        // Add new retryDelay to operation
        return pipe(
          fromValue({
            ...op,
            context: {
              ...op.context,
              retryDelay: d
            }
          }),
          // Here's the actual delay
          delay(d),
          // Stop retry if a teardown comes in
          takeUntil(teardown$)
        );
      })
    );

    const result$ = pipe(merge([sharedOps$, retryWithBackoff$]), forward, share);

    const successResult$ = pipe(
      result$,
      // We let through all non-network-failed results
      filter(res => !res.error || !res.error.networkError)
    );

    const failedResult$ = pipe(
      result$,
      filter(res => !!(res.error && res.error.networkError)),
      // Send failed responses to the retry$ subject
      tap(op => nextRetryOperation(op.operation)),
      // Only let through the first failed response
      filter(res => !res.operation.context.retryDelay)
    );

    return merge([successResult$, failedResult$]);
  }
};

import {
  makeOperation,
  Operation,
  OperationResult,
  Exchange,
} from '@urql/core';
import { pipe, tap, map } from 'wonka';

const defaultTTL = 5 * 60 * 1000;

/** Input parameters for the {@link requestPolicyExchange}. */
export interface Options {
  /** Predicate allowing you to selectively not upgrade `Operation`s.
  
  @remarks
  When `shouldUpgrade` is set, it may be used to selectively return a boolean
  per `Operation`. This allows certain `Operation`s to not be upgraded to a
  `cache-and-network` policy, when `false` is returned.
  
  By default, all `Operation`s are subject to be upgraded.
   * operation to "cache-and-network". */
  shouldUpgrade?: (op: Operation) => boolean;
  /** The time-to-live (TTL) for which a request policy won't be upgraded.
  
  @remarks
  The `ttl` defines the time frame in which the `Operation` won't be updated
  with a `cache-and-network` request policy. If an `Operation` is sent again
  and the `ttl` time period has expired, the policy is upgraded.
  
  @defaultValue `300_000` - 5min
  */
  ttl?: number;
}

/** Exchange factory that upgrades request policies to `cache-and-network` for queries outside of a defined `ttl`.
 *
 * @param options - An {@link Options} configuration object.
 * @returns the created request-policy {@link Exchange}.
 *
 * @remarks
 * The `requestPolicyExchange` upgrades query operations based on {@link Options.ttl}.
 * The `ttl` defines a timeframe outside of which a query's request policy is set to 
 * `cache-and-network` to refetch it in the background.
 *
 * You may define a {@link Options.shouldUpgrade} function to selectively ignore some
 * operations by returning `false` there.
 *
 * @example
 * ```ts
 * requestPolicyExchange({
 *  // Upgrade when we haven't seen this operation for 1 second
 *  ttl: 1000,
 *  // and only upgrade operations that query the `todos` field.
 *  shouldUpgrade: op => op.kind === 'query' && op.query.definitions[0].name?.value === 'todos'
 * });
 * ```
 */
export const requestPolicyExchange = (options: Options): Exchange => ({
  forward,
}) => {
  const operations = new Map();
  const TTL = (options || {}).ttl || defaultTTL;

  const processIncomingOperation = (operation: Operation): Operation => {
    if (
      operation.kind !== 'query' ||
      (operation.context.requestPolicy !== 'cache-first' &&
        operation.context.requestPolicy !== 'cache-only')
    ) {
      return operation;
    }

    const currentTime = new Date().getTime();
    const lastOccurrence = operations.get(operation.key) || 0;
    if (
      currentTime - lastOccurrence > TTL &&
      (!options.shouldUpgrade || options.shouldUpgrade(operation))
    ) {
      return makeOperation(operation.kind, operation, {
        ...operation.context,
        requestPolicy: 'cache-and-network',
      });
    }

    return operation;
  };

  const processIncomingResults = (result: OperationResult): void => {
    const meta = result.operation.context.meta;
    const isMiss = !meta || meta.cacheOutcome === 'miss';
    if (isMiss) {
      operations.set(result.operation.key, new Date().getTime());
    }
  };

  return ops$ => {
    return pipe(
      forward(pipe(ops$, map(processIncomingOperation))),
      tap(processIncomingResults)
    );
  };
};

import {
  makeOperation,
  Operation,
  OperationResult,
  Exchange,
} from '@urql/core';
import { pipe, tap, map } from 'wonka';

const defaultTTL = 5 * 60 * 1000;

export interface Options {
  /** A function allowing you to return a boolean on whether or not to upgrade the
   * operation to "cache-and-network". */
  shouldUpgrade?: (op: Operation) => boolean;
  /** The TTL in ms for which we should not upgrade an operation for. */
  ttl?: number;
}

/** Creates an `Exchange` that can upgrade the request-policy to "cache-and-network" of an urql query operation.
 *
 * @param options - An {@link Options} configuration object.
 * @returns the created request-policy {@link Exchange}.
 *
 * @remarks
 * The `requestPolicyExchange` observes all operations going through and allows you
 * to upgrade based on a "ttl" or "shouldUpgrade" function.
 *
 * @example
 * ```ts
 * requestPolicyExchange({
 *  // Upgrade when we haven't seen this operation for 1 second
 *  ttl: 1000,
 *  // or when it's a todos query, we always upgrade those
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

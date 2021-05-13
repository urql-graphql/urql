import {
  makeOperation,
  Operation,
  OperationResult,
  Exchange,
} from '@urql/core';
import { pipe, tap, map } from 'wonka';

const defaultTTL = 5 * 60 * 1000;

export interface Options {
  shouldUpgrade?: (op: Operation) => boolean;
  ttl?: number;
}

export const requestPolicyExchange = (options: Options): Exchange => ({
  forward,
}) => {
  const operations = new Map();
  const TTL = (options || {}).ttl || defaultTTL;

  const processIncomingOperation = (operation: Operation): Operation => {
    if (
      operation.kind !== 'query' ||
      (operation.context.requestPolicy !== 'cache-first' &&
        operation.context.requestPolicy !== 'cache-only') ||
      !operations.has(operation.key)
    ) {
      return operation;
    }

    const lastOccurrence = operations.get(operation.key);
    const currentTime = new Date().getTime();
    if (
      currentTime - lastOccurrence > TTL &&
      (options.shouldUpgrade ? options.shouldUpgrade(operation) : true)
    ) {
      operations.delete(operation.key);
      return makeOperation(operation.kind, operation, {
        ...operation.context,
        requestPolicy: 'cache-and-network',
      });
    }

    return operation;
  };

  const processIncomingResults = (result: OperationResult): void => {
    const meta = result.operation.context.meta;
    const isMiss =
      !operations.has(result.operation.key) ||
      !meta ||
      meta.cacheOutcome === 'miss';
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

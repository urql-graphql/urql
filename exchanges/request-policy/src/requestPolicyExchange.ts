import {
  makeOperation,
  Operation,
  OperationResult,
  Exchange,
  RequestPolicy,
} from '@urql/core';
import { pipe, tap, map } from 'wonka';

const defaultTTL = 5 * 60 * 1000;

export interface Options {
  shouldUpgrade?: (op: Operation) => boolean;
  ttl?: number;
  upgradePolicy?: RequestPolicy;
}

export const requestPolicyExchange = (options: Options): Exchange => {
  const operations = new Map();
  const {
    ttl: TTL = defaultTTL,
    upgradePolicy: upgradedPolicy = 'cache-and-network',
  } = options ?? {};

  return ({ forward }) => {
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
          requestPolicy: upgradedPolicy,
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
};

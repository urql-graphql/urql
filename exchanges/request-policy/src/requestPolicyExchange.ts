import { Operation, Exchange } from '@urql/core';
import { pipe, map } from 'wonka';

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
      operation.context.requestPolicy !== 'cache-first' &&
      operation.context.requestPolicy !== 'cache-only'
    )
      return operation;
    if (!operations.has(operation.key)) {
      operations.set(operation.key, new Date());
      return operation;
    }

    const lastOccurrence = operations.get(operation.key);
    const currentTime = new Date().getTime();
    if (
      currentTime - lastOccurrence.getTime() > TTL &&
      (options.shouldUpgrade ? options.shouldUpgrade(operation) : true)
    ) {
      operations.set(operation.key, new Date());
      return {
        ...operation,
        context: {
          ...operation.context,
          requestPolicy: 'cache-and-network',
        },
      };
    }

    return operation;
  };

  return ops$ => {
    return forward(pipe(ops$, map(processIncomingOperation)));
  };
};

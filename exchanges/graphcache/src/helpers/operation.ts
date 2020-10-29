import {
  Operation,
  RequestPolicy,
  CacheOutcome,
  makeOperation,
} from '@urql/core';

// Returns the given operation result with added cacheOutcome meta field
export const addCacheOutcome = (
  operation: Operation,
  outcome: CacheOutcome
): Operation =>
  makeOperation(operation.kind, operation, {
    ...operation.context,
    meta: {
      ...operation.context.meta,
      cacheOutcome: outcome,
    },
  });

// Copy an operation and change the requestPolicy to skip the cache
export const toRequestPolicy = (
  operation: Operation,
  requestPolicy: RequestPolicy
): Operation => {
  return makeOperation(operation.kind, operation, {
    ...operation.context,
    requestPolicy,
  });
};

import { Operation, RequestPolicy, CacheOutcome } from '@urql/core';

// Returns the given operation result with added cacheOutcome meta field
export const addCacheOutcome = (
  op: Operation,
  outcome: CacheOutcome
): Operation => ({
  ...op,
  context: {
    ...op.context,
    meta: {
      ...op.context.meta,
      cacheOutcome: outcome,
    },
  },
});

// Copy an operation and change the requestPolicy to skip the cache
export const toRequestPolicy = (
  operation: Operation,
  requestPolicy: RequestPolicy
): Operation => ({
  ...operation,
  context: {
    ...operation.context,
    requestPolicy,
  },
});

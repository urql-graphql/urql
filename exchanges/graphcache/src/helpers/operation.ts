import type { Operation, RequestPolicy, OperationDebugMeta } from '@urql/core';
import { makeOperation } from '@urql/core';

// Returns the given operation result with added cacheOutcome meta field
export const addMetadata = (
  operation: Operation,
  meta: OperationDebugMeta
): Operation =>
  makeOperation(operation.kind, operation, {
    ...operation.context,
    meta: {
      ...operation.context.meta,
      ...meta,
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

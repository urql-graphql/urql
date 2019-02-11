import { filter, map, merge, pipe, share, tap } from 'wonka';

import { Client } from '../lib/client';
import { formatTypeNames, gankTypeNamesFromResponse } from '../lib/typenames';
import { Exchange, Operation, OperationResult, OperationType } from '../types';

type ResultCache = Map<string, OperationResult>;
interface OperationCache {
  [key: string]: Set<string>;
}

export const cacheExchange: Exchange = ({ forward, client }) => {
  const resultCache: ResultCache = new Map();
  const operationCache: OperationCache = Object.create(null);

  // Adds unique typenames to query (for invalidating cache entries)
  const mapTypeNames = (operation: Operation): Operation => ({
    ...operation,
    query: formatTypeNames(operation.query),
  });

  const handleAfterMutation = afterMutation(
    resultCache,
    operationCache,
    client
  );

  const handleAfterQuery = afterQuery(resultCache, operationCache);

  const isOperationCached = operation =>
    operation.operationName === 'query' && resultCache.has(operation.key);

  const shouldSkip = (operation: Operation) =>
    operation.operationName !== 'mutation' &&
    operation.operationName !== 'query';

  return ops$ => {
    const sharedOps$ = share(ops$);

    const cachedOps$ = pipe(
      sharedOps$,
      filter(op => !shouldSkip(op) && isOperationCached(op)),
      map(operation => {
        // OperationResult is guaranteed to exist
        return resultCache.get(operation.key) as OperationResult;
      })
    );

    const newOps$ = pipe(
      sharedOps$,
      filter(op => !shouldSkip(op) && !isOperationCached(op)),
      map(mapTypeNames),
      forward,
      tap(response => {
        if (response.operation.operationName === 'mutation') {
          handleAfterMutation(response);
        } else if (response.operation.operationName === 'query') {
          handleAfterQuery(response);
        }
      })
    );

    const skippedOps$ = pipe(
      sharedOps$,
      filter(op => shouldSkip(op)),
      forward
    );

    return merge([cachedOps$, newOps$, skippedOps$]);
  };
};

// Invalidates the cache given a mutation's response
export const afterMutation = (
  resultCache: ResultCache,
  operationCache: OperationCache,
  client: Client
) => (response: OperationResult) => {
  const pendingOperations = new Set<string>();

  gankTypeNamesFromResponse(response.data).forEach(typeName => {
    const operations =
      operationCache[typeName] || (operationCache[typeName] = new Set());
    operations.forEach(key => pendingOperations.add(key));
    operations.clear();
  });

  pendingOperations.forEach(key => {
    const operation = (resultCache.get(key) as OperationResult).operation; // Result is guaranteed
    resultCache.delete(key);
    client.reexecuteOperation(operation);
  });
};

// Mark typenames on typenameInvalidate for early invalidation
const afterQuery = (
  resultCache: ResultCache,
  operationCache: OperationCache
) => (response: OperationResult) => {
  const {
    operation: { key },
    data,
  } = response;
  if (data === undefined) {
    return;
  }

  resultCache.set(key, response);

  gankTypeNamesFromResponse(response.data).forEach(typeName => {
    const operations =
      operationCache[typeName] || (operationCache[typeName] = new Set());
    operations.add(key);
  });
};

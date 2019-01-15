import { filter, map, merge, pipe, share, Subject, tap } from 'wonka';

import { formatTypeNames, gankTypeNamesFromResponse } from '../lib/typenames';
import { Exchange, ExchangeResult, Operation } from '../types';

type ResultCache = Map<string, ExchangeResult>;
interface OperationCache {
  [key: string]: Set<string>;
}

export const cacheExchange: Exchange = ({ forward, subject }) => {
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
    subject
  );

  const handleAfterQuery = afterQuery(resultCache, operationCache);

  const isOperationCached = operation =>
    operation.operationName === 'query' && resultCache.has(operation.key);

  return ops$ => {
    const sharedOps$ = share(ops$);

    const cachedResults$ = pipe(
      sharedOps$,
      filter(op => isOperationCached(op)),
      map(operation => {
        // ExchangeResult is guaranteed to exist
        return resultCache.get(operation.key) as ExchangeResult;
      })
    );

    const forward$ = pipe(
      sharedOps$,
      filter(op => !isOperationCached(op)),
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

    return merge([cachedResults$, forward$]);
  };
};

// Invalidates the cache given a mutation's response
export const afterMutation = (
  resultCache: ResultCache,
  operationCache: OperationCache,
  subject: Subject<Operation>
) => (response: ExchangeResult) => {
  const pendingOperations = new Set<string>();

  gankTypeNamesFromResponse(response.data).forEach(typeName => {
    const operations =
      operationCache[typeName] || (operationCache[typeName] = new Set());
    operations.forEach(key => pendingOperations.add(key));
    operations.clear();
  });

  pendingOperations.forEach(key => {
    const operation = (resultCache.get(key) as ExchangeResult).operation; // Result is guaranteed
    resultCache.delete(key);
    subject[1](operation);
  });
};

// Mark typenames on typenameInvalidate for early invalidation
const afterQuery = (
  resultCache: ResultCache,
  operationCache: OperationCache
) => (response: ExchangeResult) => {
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

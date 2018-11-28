import { Subject } from 'rxjs';
import { tap, merge, map, partition } from 'rxjs/operators';
import { Operation, ExchangeResult, Exchange } from '../types';
import { gankTypeNamesFromResponse, formatTypeNames } from '../lib/typenames';

export const cacheExchange: Exchange = ({ forward, subject }) => {
  const cache = new Map<string, ExchangeResult>();
  const cachedTypenames = new Map<string, string[]>();

  // Adds unique typenames to query (for invalidating cache entries)
  const mapTypeNames = (operation: Operation): Operation => ({
    ...operation,
    query: formatTypeNames(operation.query),
  });

  const handleAfterMutation = (response: ExchangeResult) =>
    afterMutation(response, cache, cachedTypenames, subject);

  const handleAfterQuery = (response: ExchangeResult) =>
    afterQuery(response, cache, cachedTypenames);

  return ops$ => {
    const [cacheOps$, forwardOps$] = partition<Operation>(operation =>
      cache.has(operation.key)
    )(ops$);

    const cachedResults$ = cacheOps$.pipe(
      map(operation => cache.get(operation.key))
    );

    const forward$ = forwardOps$.pipe(
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

    return cachedResults$.pipe(merge(forward$));
  };
};

// Invalidates the cache given a mutation's response
export const afterMutation = (
  response: ExchangeResult,
  cache: Map<string, ExchangeResult>,
  cachedTypenames: Map<string, string[]>,
  subject: Subject<Operation>
) => {
  let pendingOperations: Operation[] = [];

  const typenames = gankTypeNamesFromResponse(response.data.data);

  typenames.forEach(typename => {
    const typenameCacheKeys = cachedTypenames.get(typename);

    if (typenameCacheKeys === undefined) {
      return;
    }

    typenameCacheKeys.forEach(key => {
      pendingOperations = [...pendingOperations, cache.get(key).operation];
      cache.delete(key);
    });
    cachedTypenames.delete(typename);
  });

  pendingOperations.forEach(op => {
    subject.next(op);
  });
};

// Mark typenames on typenameInvalidate for early invalidation
const afterQuery = (
  response: ExchangeResult,
  cache: Map<string, ExchangeResult>,
  cachedTypenames: Map<string, string[]>
) => {
  const key = response.operation.key;
  cache.set(key, response);

  const typenames = gankTypeNamesFromResponse(response.data.data);

  typenames.forEach(typename => {
    const typenameCacheKeys = cachedTypenames.get(typename);

    cachedTypenames.set(
      typename,
      typenameCacheKeys === undefined ? [key] : [...typenameCacheKeys, key]
    );
  });
};

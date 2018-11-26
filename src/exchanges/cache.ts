import { tap, merge, map, partition } from 'rxjs/operators';
import { Operation, ExchangeResult, Exchange } from '../types';
import { gankTypeNamesFromResponse, formatTypeNames } from '../lib/typenames';

export const cacheExchange: Exchange = forward => {
  const cache = new Map<string, ExchangeResult>();
  const cachedTypenames = new Map<string, string[]>();

  // Adds unique typenames to query (for invalidating cache entries)
  const mapTypeNames = (operation: Operation): Operation => ({
    ...operation,
    query: formatTypeNames(operation.query),
  });

  // Invalidates the cache given a mutation's response
  const afterMutation = (response: ExchangeResult) => {
    const typenames = gankTypeNamesFromResponse(response.data.data);

    typenames.forEach(typename => {
      const typenameCacheKeys = cachedTypenames.get(typename);

      if (typenameCacheKeys === undefined) {
        return;
      }

      typenameCacheKeys.forEach(key => cache.delete(key));
      cachedTypenames.delete(typename);
    });
  };

  // Mark typenames on typenameInvalidate for early invalidation
  const afterQuery = (response: ExchangeResult) => {
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
          afterMutation(response);
        } else if (response.operation.operationName === 'query') {
          afterQuery(response);
        }
      })
    );

    return cachedResults$.pipe(merge(forward$));
  };
};

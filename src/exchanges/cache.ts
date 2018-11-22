import { tap, merge, map, partition } from 'rxjs/operators';
import { Operation, ExchangeResult, Exchange } from '../types';
import { gankTypeNamesFromResponse, formatTypeNames } from '../lib';

export const cacheExchange = (): Exchange => {
  const cache = new Map<string, ExchangeResult>();
  const cachedTypenames = new Map<string, string[]>();

  // Adds unique typenames to query (for invalidating cache entries)
  const mapTypeNames = (operation: Operation): Operation => ({
    ...operation,
    query: formatTypeNames(operation.query),
  });

  // Invalidates the cache given a mutation's response
  const afterMutation = (response: ExchangeResult) => {
    const typenames = gankTypeNamesFromResponse(response.data);

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
  const afterQuery = (key: string, response: ExchangeResult) => {
    cache.set(key, response);

    const typenames = gankTypeNamesFromResponse(response.data);

    typenames.forEach(typename => {
      const typenameCacheKeys = cachedTypenames.get(typename);

      cachedTypenames.set(
        key,
        typenameCacheKeys === undefined ? [key] : [...typenameCacheKeys, key]
      );
    });
  };

  return forward => ops$ => {
    const [cacheOps$, forwardOps$] = partition<Operation>(operation =>
      cache.has(operation.key)
    )(ops$);

    const cachedResults$ = cacheOps$.pipe(
      map(operation => cache.get(operation.key))
    );

    const forward$ = forwardOps$.pipe(
      map(mapTypeNames),
      forward,
      tap((response: any) => {
        if (response.operation.operationName === 'mutation') {
          afterMutation(response);
        } else if (response.operation.operationName === 'query') {
          afterQuery(response.operation.key, response);
        }
      })
    );

    return cachedResults$.pipe(merge(forward$));
  };
};

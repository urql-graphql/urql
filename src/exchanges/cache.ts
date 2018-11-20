import { Observable } from 'rxjs';
import { tap, merge, map, partition } from 'rxjs/operators';
import { IExchangeResult, IOperation } from '../interfaces';
import {
  gankTypeNamesFromResponse,
  formatTypeNames,
} from '../modules/typenames';

type ExchangeIO = (ops$: Observable<IOperation>) => Observable<IExchangeResult>;
type Exchange = (forward: ExchangeIO) => ExchangeIO;

export const cacheExchange = (): Exchange => forward => {
  const cache = new Map<string, IExchangeResult>();
  const cachedTypenames = new Map<string, string[]>();

  // Adds unique typenames to query (for invalidating cache entries)
  const mapTypeNames = (operation: IOperation): IOperation => ({
    ...operation,
    query: formatTypeNames(operation.query),
  });

  // Invalidates the cache given a mutation's response
  const afterMutation = (response: IExchangeResult) => {
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
  const afterQuery = (key: string, response: IExchangeResult) => {
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

  return ops$ => {
    const [cacheOps$, forwardOps$] = partition<IOperation>(operation =>
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
          afterQuery(response.operation.key, response);
        }
      })
    );

    return forward$.pipe(merge(cachedResults$));
  };
};

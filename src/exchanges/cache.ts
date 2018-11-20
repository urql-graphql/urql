import { Observable } from 'rxjs';
import { tap, map, merge } from 'rxjs/operators';
import { IExchangeResult, IOperation } from '../interfaces';
import {
  gankTypeNamesFromResponse,
  formatTypeNames,
} from '../modules/typenames';

type ExchangeIO = (ops$: Observable<IOperation>) => Observable<IExchangeResult>;
type Exchange = (forward: ExchangeIO) => ExchangeIO;

export const cacheExchange = (): Exchange => forward => {
  const cache = new Map<
    string,
    Observable<IExchangeResult> | IExchangeResult
  >();
  const cachedTypenames = new Map<string, string[]>();

  // Adds unique typenames to query (for invalidating cache entries)
  const mapTypeNames = (operation: IOperation) => ({
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
    const typenames = gankTypeNamesFromResponse(response.data);

    typenames.forEach(typename => {
      const typenameCacheKeys = cachedTypenames.get(typename);

      cachedTypenames.set(
        key,
        typenameCacheKeys === undefined ? [key] : [...typenameCacheKeys, key]
      );
    });
  };

  return ops$ =>
    ops$.pipe(
      map(mapTypeNames),
      merge((operation: IOperation) => {
        const key = JSON.stringify(operation);
        const cached = cache.get(key);

        if (operation.operationName === 'mutation') {
          // Make HTTP request and parses mutated response
          return forward(ops$).pipe(
            tap((response: IExchangeResult) => {
              afterMutation(response);
              return response;
            })
          );
        }

        if (operation.operationName !== 'query') {
          return forward(ops$);
        }

        if (cached !== undefined) {
          return cached;
        }

        return forward(ops$).pipe(
          tap(result => afterQuery(key, result)),
          tap(result => cache.set(key, result))
        );
      })
    );
};

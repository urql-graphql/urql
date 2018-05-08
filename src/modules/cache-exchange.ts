import Observable from 'zen-observable-ts';

import { ICache, IExchange, IExchangeResult } from '../interfaces/index';
import { gankTypeNamesFromResponse } from './typenames';

interface ITypenameInvalidate {
  [typeName: string]: string[];
}

// Wraps an exchange and refers/updates the cache according to operations
export const cacheExchange = (cache: ICache, forward: IExchange): IExchange => {
  const typenameInvalidate: ITypenameInvalidate = {};

  return operation => {
    const { operationName, key } = operation;

    const withTypenames$ = forward(operation).map(
      (response: IExchangeResult) => {
        // Grab typenames from response data
        const typeNames = gankTypeNamesFromResponse(response.data);

        // For mutations, invalidate the cache early so that unmounted Client components don't mount with
        // stale, cached responses
        if (operationName === 'mutation') {
          typeNames.forEach(typename => {
            const cacheKeys = typenameInvalidate[typename];
            typenameInvalidate[typename] = [];
            if (cacheKeys !== undefined) {
              cacheKeys.forEach(cacheKey => {
                cache.invalidate(cacheKey);
              });
            }
          });
        }

        return { ...response, typeNames };
      }
    );

    const { context } = operation;
    if (operationName !== 'query') {
      return withTypenames$;
    }

    const { skipCache = false } = context;

    return new Observable<IExchangeResult>(observer => {
      let subscription;

      cache.read(key).then(cachedResult => {
        if (cachedResult && !skipCache) {
          observer.next(cachedResult);
          observer.complete();
          return;
        }

        subscription = withTypenames$.subscribe({
          complete: () => observer.complete(),
          error: err => observer.error(err),
          next: (response: IExchangeResult) => {
            // Mark typenames on typenameInvalidate for early invalidation
            response.typeNames.forEach(typename => {
              const cacheKeys =
                typenameInvalidate[typename] ||
                (typenameInvalidate[typename] = []);
              cacheKeys.push(key);
            });
            // Store data in cache, using serialized query as key
            cache.write(key, response);
            // Return response with typeNames
            observer.next(response);
          },
        });
      });

      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    });
  };
};

import Observable from 'zen-observable-ts';

import { ICache, IExchange, IExchangeResult } from '../interfaces/index';
import { gankTypeNamesFromResponse } from './typenames';

// Wraps an exchange and refers/updates the cache according to operations
export const cacheExchange = (cache: ICache, forward: IExchange): IExchange => {
  return operation => {
    const withTypenames$ = forward(operation).map(
      (response: IExchangeResult) => {
        // Grab typenames from response data
        const typeNames = gankTypeNamesFromResponse(response.data);
        return { ...response, typeNames };
      }
    );

    const { operationName, key, context } = operation;
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

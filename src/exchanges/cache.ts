import Observable from 'zen-observable-ts';

import { IClient, Exchange, ExchangeResult } from '../interfaces/index';
import { gankTypeNamesFromResponse, formatTypeNames } from '../lib';

interface ITypenameInvalidate {
  [typeName: string]: string[];
}

// Wraps an exchange and refers/updates the cache according to operations
export const cacheExchange = (client: IClient, forward: Exchange): Exchange => {
  const typenameInvalidate: ITypenameInvalidate = {};

  // Fills the cache given a query's response
  const processQueryOnCache = (
    key: string,
    response: ExchangeResult
  ): Promise<void> => {
    // Mark typenames on typenameInvalidate for early invalidation
    gankTypeNamesFromResponse(response.data).forEach(typeName => {
      const cacheKeysForType = typenameInvalidate[typeName];
      if (cacheKeysForType === undefined) {
        typenameInvalidate[typeName] = [key];
      } else {
        cacheKeysForType.push(key);
      }
    });

    // Store data in cache, using serialized query as key
    // This needs to be done via the client to distribute the update
    return client.updateCacheEntry(key, response);
  };

  // Invalidates the cache given a mutation's response
  const processMutationOnCache = (response: ExchangeResult) => {
    let cacheKeys = [];

    // For each typeName on the response, all cache keys will need to
    // be collected
    gankTypeNamesFromResponse(response.data).forEach(typename => {
      const cacheKeysForTypename = typenameInvalidate[typename];
      typenameInvalidate[typename] = [];

      if (cacheKeysForTypename !== undefined) {
        cacheKeys = cacheKeys.concat(cacheKeysForTypename);
      }
    });

    // Batch delete all collected cache keys
    if (cacheKeys.length > 0) {
      client.deleteCacheKeys(cacheKeys);
    }
  };

  return operation => {
    // Add __typename fields to query
    // NOTE: This is a side-effect on this exchange since it's specific and necessary
    // to how this exchange works
    operation.query = formatTypeNames(operation.query);

    const { operationName } = operation;
    const forwarded$ = forward(operation);

    if (operationName === 'mutation') {
      // Forward mutation response but execute processMutationOnCache side-effect
      return forwarded$.map((response: ExchangeResult) => {
        processMutationOnCache(response);
        return response;
      });
    } else if (operationName !== 'query') {
      return forwarded$;
    }

    // Check whether cache can be skipped
    const { context, key } = operation;
    const { skipCache = false } = context;

    return new Observable<ExchangeResult>(observer => {
      let subscription;

      client.cache.read(key).then(cachedResult => {
        // Resolve a cached result if one exists
        if (cachedResult && !skipCache) {
          observer.next(cachedResult);
          observer.complete();
          return;
        }

        // Forward response but execute processsQueryOnCache side-effect
        subscription = forwarded$.subscribe({
          error: err => observer.error(err),
          next: (response: ExchangeResult) => {
            // NOTE: Wait for cache to avoid updating a client component
            // when it itself triggered this operation
            processQueryOnCache(key, response).then(() => {
              observer.next(response);
              observer.complete();
            });
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

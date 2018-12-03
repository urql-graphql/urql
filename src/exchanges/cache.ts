import { Observable, of, Subject } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { formatTypeNames, gankTypeNamesFromResponse } from '../lib';
import { Exchange, ExchangeResult, Operation } from '../types';

/** A default exchange for caching GraphQL requests. */
export const cacheExchange: Exchange = ({ forward, subject }) => {
  const cache = new Map<string, ExchangeResult>();
  const cachedTypenames = new Map<string, Set<string>>();

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
    const useCache = (stream: Observable<Operation>) =>
      stream.pipe(map(operation => cache.get(operation.key)));

    const goForward = (stream: Observable<Operation>) =>
      stream.pipe(
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

    return ops$.pipe(
      mergeMap(operation =>
        cache.has(operation.key) && !operation.context.force
          ? useCache(of(operation))
          : goForward(of(operation))
      )
    );
  };
};

// Invalidates the cache given a mutation's response
export const afterMutation = (
  response: ExchangeResult,
  cache: Map<string, ExchangeResult>,
  cachedTypenames: Map<string, Set<string>>,
  subject: Subject<Operation>
) => {
  if (response.data === undefined) {
    return;
  }

  let pendingOperations: Operation[] = [];
  const typenames = gankTypeNamesFromResponse(response.data);

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
  cachedTypenames: Map<string, Set<string>>
) => {
  if (response.data === undefined) {
    return;
  }

  const key = response.operation.key;
  cache.set(key, response);

  const typenames = gankTypeNamesFromResponse(response.data);

  typenames.forEach(typename => {
    const typenameCacheKeys = cachedTypenames.get(typename);
    cachedTypenames.set(
      typename,
      new Set(
        typenameCacheKeys === undefined ? [key] : [...typenameCacheKeys, key]
      )
    );
  });
};

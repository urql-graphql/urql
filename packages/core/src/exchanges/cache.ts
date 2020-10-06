/* eslint-disable @typescript-eslint/no-use-before-define */
import { filter, map, merge, pipe, share, tap } from 'wonka';

import { Client } from '../client';
import { Exchange, Operation, OperationResult, ExchangeInput } from '../types';
import {
  addMetadata,
  collectTypesFromResponse,
  formatDocument,
} from '../utils';

type ResultCache = Map<number, OperationResult>;

interface OperationCache {
  [key: string]: Set<number>;
}

const shouldSkip = ({ kind }: Operation) =>
  kind !== 'mutation' && kind !== 'query';

export const cacheExchange: Exchange = ({ forward, client, dispatchDebug }) => {
  const resultCache = new Map() as ResultCache;
  const operationCache = Object.create(null) as OperationCache;

  // Adds unique typenames to query (for invalidating cache entries)
  const mapTypeNames = (operation: Operation): Operation => ({
    ...operation,
    query: formatDocument(operation.query),
  });

  const handleAfterMutation = afterMutation(
    resultCache,
    operationCache,
    client,
    dispatchDebug
  );

  const handleAfterQuery = afterQuery(resultCache, operationCache);

  const isOperationCached = (operation: Operation) => {
    const {
      key,
      kind,
      context: { requestPolicy },
    } = operation;
    return (
      kind === 'query' &&
      requestPolicy !== 'network-only' &&
      (requestPolicy === 'cache-only' || resultCache.has(key))
    );
  };

  return ops$ => {
    const sharedOps$ = share(ops$);

    const cachedOps$ = pipe(
      sharedOps$,
      filter(op => !shouldSkip(op) && isOperationCached(op)),
      map(operation => {
        const cachedResult = resultCache.get(operation.key);

        dispatchDebug({
          operation,
          ...(cachedResult
            ? {
                type: 'cacheHit',
                message: 'The result was successfully retried from the cache',
              }
            : {
                type: 'cacheMiss',
                message: 'The result could not be retrieved from the cache',
              }),
        });

        const result: OperationResult = {
          ...cachedResult,
          operation: addMetadata(operation, {
            cacheOutcome: cachedResult ? 'hit' : 'miss',
          }),
        };

        if (operation.context.requestPolicy === 'cache-and-network') {
          result.stale = true;
          reexecuteOperation(client, operation);
        }

        return result;
      })
    );

    const forwardedOps$ = pipe(
      merge([
        pipe(
          sharedOps$,
          filter(op => !shouldSkip(op) && !isOperationCached(op)),
          map(mapTypeNames)
        ),
        pipe(
          sharedOps$,
          filter(op => shouldSkip(op))
        ),
      ]),
      map(op => addMetadata(op, { cacheOutcome: 'miss' })),
      filter(
        op => op.kind !== 'query' || op.context.requestPolicy !== 'cache-only'
      ),
      forward,
      tap(response => {
        if (response.operation && response.operation.kind === 'mutation') {
          handleAfterMutation(response);
        } else if (response.operation && response.operation.kind === 'query') {
          handleAfterQuery(response);
        }
      })
    );

    return merge([cachedOps$, forwardedOps$]);
  };
};

// Reexecutes a given operation with the default requestPolicy
const reexecuteOperation = (client: Client, operation: Operation) => {
  return client.reexecuteOperation({
    ...operation,
    context: {
      ...operation.context,
      requestPolicy: 'network-only',
    },
  });
};

// Invalidates the cache given a mutation's response
export const afterMutation = (
  resultCache: ResultCache,
  operationCache: OperationCache,
  client: Client,
  dispatchDebug: ExchangeInput['dispatchDebug']
) => (response: OperationResult) => {
  const pendingOperations = new Set<number>();
  const { additionalTypenames } = response.operation.context;

  const typenames = [
    ...collectTypesFromResponse(response.data),
    ...(additionalTypenames || []),
  ];

  dispatchDebug({
    type: 'cacheInvalidation',
    message: `The following typenames have been invalidated: ${typenames}`,
    operation: response.operation,
    data: { typenames, response },
  });

  typenames.forEach(typeName => {
    const operations =
      operationCache[typeName] || (operationCache[typeName] = new Set());
    operations.forEach(key => {
      pendingOperations.add(key);
    });
    operations.clear();
  });

  pendingOperations.forEach(key => {
    if (resultCache.has(key)) {
      const operation = (resultCache.get(key) as OperationResult).operation;
      resultCache.delete(key);
      reexecuteOperation(client, operation);
    }
  });
};

// Mark typenames on typenameInvalidate for early invalidation
const afterQuery = (
  resultCache: ResultCache,
  operationCache: OperationCache
) => (response: OperationResult) => {
  const { operation, data, error } = response;
  const { additionalTypenames } = operation.context;

  if (data === undefined || data === null) {
    return;
  }

  resultCache.set(operation.key, { operation, data, error });

  [
    ...collectTypesFromResponse(response.data),
    ...(additionalTypenames || []),
  ].forEach(typeName => {
    const operations =
      operationCache[typeName] || (operationCache[typeName] = new Set());
    operations.add(operation.key);
  });
};

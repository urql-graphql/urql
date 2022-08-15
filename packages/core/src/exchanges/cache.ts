/* eslint-disable @typescript-eslint/no-use-before-define */
import { filter, map, merge, pipe, share, tap } from 'wonka';

import { Client } from '../client';
import { Exchange, Operation, OperationResult } from '../types';

import {
  makeOperation,
  addMetadata,
  collectTypesFromResponse,
  formatDocument,
} from '../utils';

type ResultCache = Map<number, OperationResult>;
type OperationCache = Map<string, Set<number>>;

const shouldSkip = ({ kind }: Operation) =>
  kind !== 'mutation' && kind !== 'query';

export const cacheExchange: Exchange = ({ forward, client, dispatchDebug }) => {
  const resultCache: ResultCache = new Map();
  const operationCache: OperationCache = new Map();

  // Adds unique typenames to query (for invalidating cache entries)
  const mapTypeNames = (operation: Operation): Operation => {
    const formattedOperation = makeOperation(operation.kind, operation);
    formattedOperation.query = formatDocument(operation.query);
    return formattedOperation;
  };

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
        let { operation } = response;
        if (!operation) return;

        const typenames = collectTypesFromResponse(response.data).concat(
          operation.context.additionalTypenames || []
        );

        // Invalidates the cache given a mutation's response
        if (response.operation.kind === 'mutation') {
          const pendingOperations = new Set<number>();

          dispatchDebug({
            type: 'cacheInvalidation',
            message: `The following typenames have been invalidated: ${typenames}`,
            operation,
            data: { typenames, response },
          });

          for (let i = 0; i < typenames.length; i++) {
            const typeName = typenames[i];
            let operations = operationCache.get(typeName);
            if (!operations)
              operationCache.set(typeName, (operations = new Set()));
            for (const key of operations.values()) pendingOperations.add(key);
            operations.clear();
          }

          for (const key of pendingOperations.values()) {
            if (resultCache.has(key)) {
              operation = (resultCache.get(key) as OperationResult).operation;
              resultCache.delete(key);
              reexecuteOperation(client, operation);
            }
          }
        } else if (operation.kind === 'query' && response.data) {
          resultCache.set(operation.key, response);
          for (let i = 0; i < typenames.length; i++) {
            const typeName = typenames[i];
            let operations = operationCache.get(typeName);
            if (!operations)
              operationCache.set(typeName, (operations = new Set()));
            operations.add(operation.key);
          }
        }
      })
    );

    return merge([cachedOps$, forwardedOps$]);
  };
};

// Reexecutes a given operation with the default requestPolicy
export const reexecuteOperation = (client: Client, operation: Operation) => {
  return client.reexecuteOperation(
    makeOperation(operation.kind, operation, {
      ...operation.context,
      requestPolicy: 'network-only',
    })
  );
};

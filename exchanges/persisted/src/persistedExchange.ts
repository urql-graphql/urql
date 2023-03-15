import {
  map,
  makeSubject,
  fromPromise,
  filter,
  merge,
  mergeMap,
  pipe,
  share,
} from 'wonka';

import {
  makeOperation,
  stringifyDocument,
  PersistedRequestExtensions,
  OperationResult,
  CombinedError,
  Exchange,
  Operation,
} from '@urql/core';

import type { DocumentNode } from 'graphql';

import { hash } from './sha256';

const isPersistedMiss = (error: CombinedError): boolean =>
  error.graphQLErrors.some(x => x.message === 'PersistedQueryNotFound');

const isPersistedUnsupported = (error: CombinedError): boolean =>
  error.graphQLErrors.some(x => x.message === 'PersistedQueryNotSupported');

export interface PersistedExchangeOptions {
  preferGetForPersistedQueries?: boolean;
  enforcePersistedQueries?: boolean;
  generateHash?: (query: string, document: DocumentNode) => Promise<string>;
  enableForMutation?: boolean;
}

export const persistedExchange = (
  options?: PersistedExchangeOptions
): Exchange => ({ forward }) => {
  if (!options) options = {};

  const preferGetForPersistedQueries = !!options.preferGetForPersistedQueries;
  const enforcePersistedQueries = !!options.enforcePersistedQueries;
  const hashFn = options.generateHash || hash;
  const enableForMutation = !!options.enableForMutation;
  let supportsPersistedQueries = true;

  const operationFilter = (operation: Operation) =>
    supportsPersistedQueries &&
    !operation.context.persistAttempt &&
    ((enableForMutation && operation.kind === 'mutation') ||
      operation.kind === 'query');

  return operations$ => {
    const retries = makeSubject<Operation>();
    const sharedOps$ = share(operations$);

    const forwardedOps$ = pipe(
      sharedOps$,
      filter(operation => !operationFilter(operation))
    );

    const persistedOps$ = pipe(
      sharedOps$,
      filter(operationFilter),
      map(async operation => {
        const persistedOperation = makeOperation(operation.kind, operation, {
          ...operation.context,
          persistAttempt: true,
        });

        const sha256Hash = await hashFn(
          stringifyDocument(operation.query),
          operation.query
        );
        if (sha256Hash) {
          persistedOperation.extensions = {
            ...persistedOperation.extensions,
            persistedQuery: {
              version: 1,
              sha256Hash,
            },
          };
          if (
            persistedOperation.kind === 'query' &&
            preferGetForPersistedQueries
          ) {
            persistedOperation.context.preferGetMethod = 'force';
          }
        }

        return persistedOperation;
      }),
      mergeMap(fromPromise)
    );

    return pipe(
      merge([persistedOps$, forwardedOps$, retries.source]),
      forward,
      map(result => {
        if (
          !enforcePersistedQueries &&
          result.operation.extensions &&
          result.operation.extensions.persistedQuery
        ) {
          if (result.error && isPersistedUnsupported(result.error)) {
            // Disable future persisted queries if they're not enforced
            supportsPersistedQueries = false;
            // Update operation with unsupported attempt
            const followupOperation = makeOperation(
              result.operation.kind,
              result.operation
            );
            if (followupOperation.extensions)
              delete followupOperation.extensions.persistedQuery;
            retries.next(followupOperation);
            return null;
          } else if (result.error && isPersistedMiss(result.error)) {
            // Update operation with unsupported attempt
            const followupOperation = makeOperation(
              result.operation.kind,
              result.operation
            );
            // Mark as missed persisted query
            followupOperation.extensions = {
              ...followupOperation.extensions,
              persistedQuery: {
                ...(followupOperation.extensions || {}).persistedQuery,
                miss: true,
              } as PersistedRequestExtensions,
            };
            retries.next(followupOperation);
            return null;
          }
        }
        return result;
      }),
      filter((result): result is OperationResult => !!result)
    );
  };
};

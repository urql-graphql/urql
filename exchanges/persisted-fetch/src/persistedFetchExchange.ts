/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  Source,
  fromValue,
  fromPromise,
  filter,
  merge,
  mergeMap,
  pipe,
  share,
  onPush,
  takeUntil,
} from 'wonka';

import {
  makeOperation,
  CombinedError,
  ExchangeInput,
  Exchange,
  Operation,
  OperationResult,
} from '@urql/core';

import {
  FetchBody,
  makeFetchBody,
  makeFetchURL,
  makeFetchOptions,
  makeFetchSource,
} from '@urql/core/internal';
import { DocumentNode } from 'graphql';

import { hash } from './sha256';

interface PersistedFetchExchangeOptions {
  preferGetForPersistedQueries?: boolean;
  enforcePersistedQueries?: boolean;
  generateHash?: (query: string, document: DocumentNode) => Promise<string>;
  enableForMutation?: boolean;
}

export const persistedFetchExchange = (
  options?: PersistedFetchExchangeOptions
): Exchange => ({ forward, dispatchDebug }) => {
  if (!options) options = {};

  const preferGetForPersistedQueries = !!options.preferGetForPersistedQueries;
  const enforcePersistedQueries = !!options.enforcePersistedQueries;
  const hashFn = options.generateHash || hash;
  const enableForMutation = !!options.enableForMutation;
  let supportsPersistedQueries = true;

  const operationFilter = (operation: Operation) =>
    (enableForMutation && operation.kind === 'mutation') ||
    operation.kind === 'query';

  return ops$ => {
    const sharedOps$ = share(ops$);
    const fetchResults$ = pipe(
      sharedOps$,
      filter(operationFilter),
      mergeMap(operation => {
        const { key } = operation;
        const teardown$ = pipe(
          sharedOps$,
          filter(op => op.kind === 'teardown' && op.key === key)
        );

        const body = makeFetchBody(operation);
        if (!supportsPersistedQueries) {
          // Runs the usual non-persisted fetchExchange query logic
          return pipe(
            makePersistedFetchSource(operation, body, dispatchDebug, false),
            takeUntil(teardown$)
          );
        }

        const query: string = body.query!;

        return pipe(
          // Hash the given GraphQL query
          fromPromise(hashFn(query, operation.query)),
          mergeMap(sha256Hash => {
            // if the hashing operation was successful, add the persisted query extension
            if (sha256Hash) {
              // Attach SHA256 hash and remove query from body
              body.query = undefined;
              body.extensions = {
                persistedQuery: {
                  version: 1,
                  sha256Hash,
                },
              };
            }
            const useGet =
              operation.kind === 'query' &&
              preferGetForPersistedQueries &&
              !!sha256Hash;
            return makePersistedFetchSource(
              operation,
              body,
              dispatchDebug,
              useGet
            );
          }),
          mergeMap(result => {
            if (!enforcePersistedQueries) {
              if (result.error && isPersistedUnsupported(result.error)) {
                // Reset the body back to its non-persisted state
                body.query = query;
                body.extensions = undefined;
                // Disable future persisted queries if they're not enforced
                supportsPersistedQueries = false;
                return makePersistedFetchSource(
                  operation,
                  body,
                  dispatchDebug,
                  false
                );
              } else if (result.error && isPersistedMiss(result.error)) {
                // Add query to the body but leave SHA256 hash intact
                body.query = query;
                return makePersistedFetchSource(
                  operation,
                  body,
                  dispatchDebug,
                  false
                );
              }
            }

            return fromValue(result);
          }),
          takeUntil(teardown$)
        );
      })
    );

    const forward$ = pipe(
      sharedOps$,
      filter(operation => !operationFilter(operation)),
      forward
    );

    return merge([fetchResults$, forward$]);
  };
};

const makePersistedFetchSource = (
  operation: Operation,
  body: FetchBody,
  dispatchDebug: ExchangeInput['dispatchDebug'],
  useGet: boolean
): Source<OperationResult> => {
  const newOperation = makeOperation(operation.kind, operation, {
    ...operation.context,
    preferGetMethod: useGet || operation.context.preferGetMethod,
  });

  const url = makeFetchURL(
    newOperation,
    body.query ? body : { ...body, query: '' }
  );

  const fetchOptions = makeFetchOptions(newOperation, body);

  dispatchDebug({
    type: 'fetchRequest',
    message: !body.query
      ? 'A fetch request for a persisted query is being executed.'
      : 'A fetch request is being executed.',
    operation: newOperation,
    data: {
      url,
      fetchOptions,
    },
  });

  return pipe(
    makeFetchSource(newOperation, url, fetchOptions),
    onPush(result => {
      const persistFail =
        result.error &&
        (isPersistedMiss(result.error) || isPersistedUnsupported(result.error));
      const error = !result.data ? result.error : undefined;

      dispatchDebug({
        // TODO: Assign a new name to this once @urql/devtools supports it
        type: persistFail || error ? 'fetchError' : 'fetchSuccess',
        message: persistFail
          ? 'A Persisted Query request has failed. A non-persisted GraphQL request will follow.'
          : `A ${
              error ? 'failed' : 'successful'
            } fetch response has been returned.`,
        operation,
        data: {
          url,
          fetchOptions,
          value: persistFail ? result.error! : error || result,
        },
      });
    })
  );
};

const isPersistedMiss = (error: CombinedError): boolean =>
  error.graphQLErrors.some(x => x.message === 'PersistedQueryNotFound');

const isPersistedUnsupported = (error: CombinedError): boolean =>
  error.graphQLErrors.some(x => x.message === 'PersistedQueryNotSupported');

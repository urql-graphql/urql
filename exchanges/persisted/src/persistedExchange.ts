import {
  map,
  makeSubject,
  fromPromise,
  filter,
  merge,
  mergeMap,
  pipe,
} from 'wonka';

import {
  makeOperation,
  stringifyDocument,
  PersistedRequestExtensions,
  TypedDocumentNode,
  OperationResult,
  CombinedError,
  Exchange,
  Operation,
  OperationContext,
} from '@urql/core';

import { hash } from './sha256';

const isPersistedMiss = (error: CombinedError): boolean =>
  error.graphQLErrors.some(x => x.message === 'PersistedQueryNotFound');

const isPersistedUnsupported = (error: CombinedError): boolean =>
  error.graphQLErrors.some(x => x.message === 'PersistedQueryNotSupported');

/** Input parameters for the {@link persistedExchange}. */
export interface PersistedExchangeOptions {
  /** Controls whether GET method requests will be made for Persisted Queries.
   *
   * @remarks
   * When set to `true` or `'within-url-limit'`, the `persistedExchange`
   * will use GET requests on persisted queries when the request URL
   * doesn't exceed the 2048 character limit.
   *
   * When set to `force`, the `persistedExchange` will set
   * `OperationContext.preferGetMethod` to `'force'` on persisted queries,
   * which will force requests to be made using a GET request.
   *
   * GET requests are frequently used to make GraphQL requests more
   * cacheable on CDNs.
   *
   * @defaultValue `undefined` - disabled
   */
  preferGetForPersistedQueries?: OperationContext['preferGetMethod'];
  /** Enforces non-automatic persisted queries by ignoring APQ errors.
   *
   * @remarks
   * When enabled, the `persistedExchange` will ignore `PersistedQueryNotFound`
   * and `PersistedQueryNotSupported` errors and assume that all persisted
   * queries are already known to the API.
   *
   * This is used to switch from Automatic Persisted Queries to
   * Persisted Queries. This is commonly used to obfuscate GraphQL
   * APIs.
   */
  enforcePersistedQueries?: boolean;
  /** Custom hashing function for persisted queries.
   *
   * @remarks
   * By default, `persistedExchange` will create a SHA-256 hash for
   * persisted queries automatically. If you're instead generating
   * hashes at compile-time, or need to use a custom SHA-256 function,
   * you may pass one here.
   *
   * Hint: The default SHA-256 function uses the WebCrypto API. This
   * API is unavailable on React Native, which may require you to
   * pass a custom function here.
   */
  generateHash?(
    query: string,
    document: TypedDocumentNode<any, any>
  ): Promise<string>;
  /** Enables persisted queries to be used for mutations.
   *
   * @remarks
   * When enabled, the `persistedExchange` will also use the persisted queries
   * logic for mutation operations.
   *
   * This is disabled by default, but often used on APIs that obfuscate
   * their GraphQL APIs.
   */
  enableForMutation?: boolean;
}

/** Exchange factory that adds support for Persisted Queries.
 *
 * @param options - A {@link PersistedExchangeOptions} configuration object.
 * @returns the created persisted queries {@link Exchange}.
 *
 * @remarks
 * The `persistedExchange` adds support for (Automatic) Persisted Queries
 * to any `fetchExchange`, `subscriptionExchange`, or other API exchanges
 * following it.
 *
 * It does so by adding the `persistedQuery` extensions field to GraphQL
 * requests and handles `PersistedQueryNotFound` and
 * `PersistedQueryNotSupported` errors.
 *
 * @example
 * ```ts
 * import { Client, cacheExchange, fetchExchange } from '@urql/core';
 * import { persistedExchange } from '@urql/exchange-persisted';
 *
 * const client = new Client({
 *   url: 'URL',
 *   exchanges: [
 *     cacheExchange,
 *     persistedExchange({
 *       preferGetForPersistedQueries: true,
 *     }),
 *     fetchExchange
 *   ],
 * });
 * ```
 */
export const persistedExchange =
  (options?: PersistedExchangeOptions): Exchange =>
  ({ forward }) => {
    if (!options) options = {};

    const preferGetForPersistedQueries = options.preferGetForPersistedQueries;
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

      const forwardedOps$ = pipe(
        operations$,
        filter(operation => !operationFilter(operation))
      );

      const persistedOps$ = pipe(
        operations$,
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
              persistedOperation.context.preferGetMethod =
                preferGetForPersistedQueries;
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

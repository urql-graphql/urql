import {
  map,
  makeSubject,
  fromPromise,
  filter,
  merge,
  mergeMap,
  takeUntil,
  pipe,
} from 'wonka';

import type {
  PersistedRequestExtensions,
  TypedDocumentNode,
  OperationResult,
  CombinedError,
  Exchange,
  Operation,
  OperationContext,
} from '@urql/core';
import { makeOperation, stringifyDocument } from '@urql/core';

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
   * @defaultValue `within-url-limit` - Use GET requests for persisted queries within the URL limit.
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
   * If `generateHash` returns either `null` or `undefined`, the
   * operation will not be treated as a persisted operation, which
   * essentially skips this exchange’s logic for a given operation.
   *
   * Hint: The default SHA-256 function uses the WebCrypto API. This
   * API is unavailable on React Native, which may require you to
   * pass a custom function here.
   */
  generateHash?(
    query: string,
    document: TypedDocumentNode<any, any>
  ): Promise<string | undefined | null>;
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
  /** Enables persisted queries to be used for subscriptions.
   *
   * @remarks
   * When enabled, the `persistedExchange` will also use the persisted queries
   * logic for subscription operations.
   *
   * This is disabled by default, but often used on APIs that obfuscate
   * their GraphQL APIs.
   */
  enableForSubscriptions?: boolean;
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

    const preferGetForPersistedQueries =
      options.preferGetForPersistedQueries || 'within-url-limit';
    const enforcePersistedQueries = !!options.enforcePersistedQueries;
    const hashFn = options.generateHash || hash;
    const enableForMutation = !!options.enableForMutation;
    const enableForSubscriptions = !!options.enableForSubscriptions;
    let supportsPersistedQueries = true;

    const operationFilter = (operation: Operation) =>
      supportsPersistedQueries &&
      !operation.context.persistAttempt &&
      ((enableForMutation && operation.kind === 'mutation') ||
        (enableForSubscriptions && operation.kind === 'subscription') ||
        operation.kind === 'query');

    const getPersistedOperation = async (operation: Operation) => {
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
    };

    return operations$ => {
      const retries = makeSubject<Operation>();

      const forwardedOps$ = pipe(
        operations$,
        filter(operation => !operationFilter(operation))
      );

      const persistedOps$ = pipe(
        operations$,
        filter(operationFilter),
        mergeMap(operation => {
          const persistedOperation$ = getPersistedOperation(operation);
          return pipe(
            fromPromise(persistedOperation$),
            takeUntil(
              pipe(
                operations$,
                filter(op => op.kind === 'teardown' && op.key === operation.key)
              )
            )
          );
        })
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
              if (result.operation.extensions.persistedQuery.miss) {
                if (process.env.NODE_ENV !== 'production') {
                  console.warn(
                    'persistedExchange()’s results include two misses for the same operation.\n' +
                      'This is not expected as it means a persisted error has been delivered for a non-persisted query!\n' +
                      'Another exchange with a cache may be delivering an outdated result. For example, a server-side ssrExchange() may be caching an errored result.\n' +
                      'Try moving the persistedExchange() in past these exchanges, for example in front of your fetchExchange.'
                  );
                }

                return result;
              }
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

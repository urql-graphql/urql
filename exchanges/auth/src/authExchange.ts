import {
  Source,
  pipe,
  map,
  filter,
  onStart,
  take,
  makeSubject,
  toPromise,
  merge,
  share,
} from 'wonka';

import {
  createRequest,
  makeOperation,
  Operation,
  OperationContext,
  OperationResult,
  CombinedError,
  Exchange,
  TypedDocumentNode,
  AnyVariables,
} from '@urql/core';

import { DocumentNode } from 'graphql';

/** Utilities to use while refreshing authentication tokens. */
export interface AuthUtilities {
  /** Sends a mutation to your GraphQL API, bypassing earlier exchanges and authentication.
   *
   * @param query - a GraphQL document containing the mutation operation that will be executed.
   * @param variables - the variables used to execute the operation.
   * @param context - {@link OperationContext} options that'll be used in future exchanges.
   * @returns A `Promise` of an {@link OperationResult} for the GraphQL mutation.
   *
   * @remarks
   * The `mutation()` utility method is useful when your authentication requires you to make a GraphQL mutation
   * request to update your authentication tokens. In these cases, you likely wish to bypass prior exchanges and
   * the authentication in the `authExchange` itself.
   *
   * This method bypasses the usual mutation flow of the `Client` and instead issues the mutation as directly
   * as possible. This also means that it doesn’t carry your `Client`'s default {@link OperationContext}
   * options, so you may have to pass them again, if needed.
   */
  mutate<Data = any, Variables extends AnyVariables = AnyVariables>(
    query: DocumentNode | TypedDocumentNode<Data, Variables> | string,
    variables: Variables,
    context?: Partial<OperationContext>
  ): Promise<OperationResult<Data>>;

  /** Adds additional HTTP headers to an `Operation`.
   *
   * @param operation - An {@link Operation} to add headers to.
   * @param headers - The HTTP headers to add to the `Operation`.
   * @returns The passed {@link Operation} with the headers added to it.
   *
   * @remarks
   * The `appendHeaders()` utility method is useful to add additional HTTP headers
   * to an {@link Operation}. It’s a simple convenience function that takes
   * `operation.context.fetchOptions` into account, since adding headers for
   * authentication is common.
   */
  appendHeaders(
    operation: Operation,
    headers: Record<string, string>
  ): Operation;
}

/** Configuration for the `authExchange` returned by the initializer function you write. */
export interface AuthConfig {
  /** Called for every operation to add authentication data to your operation.
   *
   * @param operation - An {@link Operation} that needs authentication tokens added.
   * @returns a new {@link Operation} with added authentication tokens.
   *
   * @remarks
   * The {@link authExchange} will call this function you provide and expects that you
   * add your authentication tokens to your operation here, on the {@link Operation}
   * that is returned.
   *
   * Hint: You likely want to modify your `fetchOptions.headers` here, for instance to
   * add an `Authorization` header.
   */
  addAuthToOperation(operation: Operation): Operation;

  /** Called before an operation is forwaded onwards to make a request.
   *
   * @param operation - An {@link Operation} that needs authentication tokens added.
   * @returns a boolean, if true, authentication must be refreshed.
   *
   * @remarks
   * The {@link authExchange} will call this function before an {@link Operation} is
   * forwarded onwards to your following exchanges.
   *
   * When this function returns `true`, the `authExchange` will call
   * {@link AuthConfig.refreshAuth} before forwarding more operations
   * to prompt you to update your authentication tokens.
   *
   * Hint: If you define this function, you can use it to check whether your authentication
   * tokens have expired.
   */
  willAuthError?(operation: Operation): boolean;

  /** Called after receiving an operation result to check whether it has failed with an authentication error.
   *
   * @param error - A {@link CombinedError} that a result has come back with.
   * @param operation - The {@link Operation} of that has failed.
   * @returns a boolean, if true, authentication must be refreshed.
   *
   * @remarks
   * The {@link authExchange} will call this function if it sees an {@link OperationResult}
   * with a {@link CombinedError} on it, implying that it may have failed due to an authentication
   * error.
   *
   * When this function returns `true`, the `authExchange` will call
   * {@link AuthConfig.refreshAuth} before forwarding more operations
   * to prompt you to update your authentication tokens.
   * Afterwards, this operation will be retried once.
   *
   * Hint: You should define a function that detects your API’s authentication
   * errors, e.g. using `result.extensions`.
   */
  didAuthError(error: CombinedError, operation: Operation): boolean;

  /** Called to refresh the authentication state.
   *
   * @remarks
   * The {@link authExchange} will call this function if either {@link AuthConfig.willAuthError}
   * or {@link AuthConfig.didAuthError} have returned `true` prior, which indicates that the
   * authentication state you hold has expired or is out-of-date.
   *
   * When this function is called, you should refresh your authentication state.
   * For instance, if you have a refresh token and an access token, you should rotate
   * these tokens with your API by sending the refresh token.
   *
   * Hint: You can use the {@link fetch} API here, or use {@link AuthUtilities.mutate}
   * if your API requires a GraphQL mutation to refresh your authentication state.
   */
  refreshAuth(): Promise<void>;
}

const addAuthAttemptToOperation = (
  operation: Operation,
  authAttempt: boolean
) =>
  makeOperation(operation.kind, operation, {
    ...operation.context,
    authAttempt,
  });

/** Creates an `Exchange` handling control flow for authentication.
 *
 * @param init - An initializer function that returns an {@link AuthConfig} wrapped in a `Promise`.
 * @returns the created authentication {@link Exchange}.
 *
 * @remarks
 * The `authExchange` is used to create an exchange handling authentication and
 * the control flow of refresh authentication.
 *
 * You must pass an initializer function, which receives {@link AuthUtilities} and
 * must return an {@link AuthConfig} wrapped in a `Promise`.
 * When this exchange is used in your `Client`, it will first call your initializer
 * function, which gives you an opportunity to get your authentication state, e.g.
 * from local storage.
 *
 * You may then choose to validate this authentication state and update it, and must
 * then return an {@link AuthConfig}.
 *
 * This configuration defines how you add authentication state to {@link Operation | Operations},
 * when your authentication state expires, when an {@link OperationResult} has errored
 * with an authentication error, and how to refresh your authentication state.
 */
export function authExchange(
  init: (utilities: AuthUtilities) => Promise<AuthConfig>
): Exchange {
  return ({ client, forward }) => {
    const bypassQueue: WeakSet<Operation> = new WeakSet();
    const retryQueue = new Map<number, Operation>();
    const retries = makeSubject<Operation>();

    function flushQueue(_config?: AuthConfig | undefined) {
      authPromise = undefined;
      retryQueue.forEach(retries.next);
      retryQueue.clear();
      if (_config) config = _config;
    }

    let authPromise: Promise<void> | void;
    let config: AuthConfig | null = null;

    return operations$ => {
      authPromise = init({
        mutate<Data = any, Variables extends AnyVariables = AnyVariables>(
          query: DocumentNode | string,
          variables: Variables,
          context?: Partial<OperationContext>
        ): Promise<OperationResult<Data>> {
          const operation = client.createRequestOperation(
            'mutation',
            createRequest(query, variables),
            context
          );

          return pipe(
            result$,
            onStart(() => {
              bypassQueue.add(operation);
              retries.next(operation);
            }),
            filter(result => result.operation.key === operation.key),
            take(1),
            toPromise
          );
        },
        appendHeaders(operation: Operation, headers: Record<string, string>) {
          const fetchOptions =
            typeof operation.context.fetchOptions === 'function'
              ? operation.context.fetchOptions()
              : operation.context.fetchOptions || {};
          return makeOperation(operation.kind, operation, {
            ...operation.context,
            fetchOptions: {
              ...fetchOptions,
              headers: {
                ...fetchOptions.headers,
                ...headers,
              },
            },
          });
        },
      }).then(flushQueue);

      function refreshAuth(operation: Operation) {
        // add to retry queue to try again later
        operation = addAuthAttemptToOperation(operation, true);
        retryQueue.set(operation.key, operation);
        // check that another operation isn't already doing refresh
        if (config && !authPromise) {
          authPromise = config.refreshAuth().finally(flushQueue);
        }
      }

      function willAuthError(operation: Operation) {
        return (
          config &&
          !authPromise &&
          config.willAuthError &&
          config.willAuthError(operation)
        );
      }

      function didAuthError(result: OperationResult) {
        return (
          config &&
          !authPromise &&
          config.didAuthError &&
          config.didAuthError(result.error!, result.operation)
        );
      }

      function addAuthToOperation(operation: Operation) {
        return config && !authPromise
          ? config.addAuthToOperation(operation)
          : operation;
      }

      const sharedOps$ = pipe(operations$, share);

      const teardownOps$ = pipe(
        sharedOps$,
        filter((operation: Operation) => {
          return operation.kind === 'teardown';
        })
      );

      const pendingOps$ = pipe(
        sharedOps$,
        filter((operation: Operation) => {
          return operation.kind !== 'teardown';
        })
      );

      const opsWithAuth$ = pipe(
        merge([retries.source, pendingOps$]),
        map(operation => {
          if (bypassQueue.has(operation)) {
            return operation;
          } else if (authPromise) {
            retryQueue.set(
              operation.key,
              addAuthAttemptToOperation(operation, false)
            );
            return null;
          } else if (!operation.context.authAttempt && willAuthError(operation)) {
            refreshAuth(operation);
            return null;
          }

          return addAuthToOperation(addAuthAttemptToOperation(operation, false));
        }),
        filter(Boolean)
      ) as Source<Operation>;

      const result$ = pipe(merge([opsWithAuth$, teardownOps$]), forward, share);

      return pipe(
        result$,
        filter(result => {
          if (
            result.error &&
            didAuthError(result) &&
            !result.operation.context.authAttempt
          ) {
            refreshAuth(result.operation);
            return false;
          }

          return true;
        })
      );
    };
  };
}

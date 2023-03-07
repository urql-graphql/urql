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

export interface AuthUtilities {
  /** The mutate() method may be used to send one-off mutations to the GraphQL API for the purpose of authentication. */
  mutate<Data = any, Variables extends AnyVariables = AnyVariables>(
    query: DocumentNode | TypedDocumentNode<Data, Variables> | string,
    variables: Variables,
    context?: Partial<OperationContext>
  ): Promise<OperationResult<Data>>;
}

export interface AuthConfig {
  /** addAuthToOperation() must be provided to add the custom `authState` to an Operation's context, so that it may be picked up by the `fetchExchange`. */
  addAuthToOperation(operation: Operation): Operation;

  /** didAuthError() may be provided to tweak the detection of an authentication error that this exchange should handle. */
  didAuthError?(error: CombinedError, operation: Operation): boolean;

  /** willAuthError() may be provided to detect a potential operation that'll receive authentication error so that getAuth() can be run proactively. */
  willAuthError?(operation: Operation): boolean;

  /** getAuth() handles how the application refreshes or reauthenticates given a stale `authState` and should return a new `authState` or `null`. */
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

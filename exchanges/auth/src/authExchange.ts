import {
  pipe,
  map,
  mergeMap,
  fromPromise,
  fromValue,
  filter,
  onStart,
  take,
  makeSubject,
  toPromise,
  merge,
  share,
  takeUntil,
} from 'wonka';

import {
  Operation,
  OperationContext,
  OperationResult,
  CombinedError,
  Exchange,
  createRequest,
} from '@urql/core';

import { DocumentNode } from 'graphql';

export interface AuthConfig<T> {
  /** addAuthToOperation() must be provided to add the custom `authState` to an Operation's context, so that it may be picked up by the `fetchExchange`. */
  addAuthToOperation(params: {
    authState: T | null;
    operation: Operation;
  }): Operation;

  /** didAuthError() may be provided to tweak the detection of an authentication error that this exchange should handle. */
  didAuthError?(params: { error: CombinedError; authState: T | null }): boolean;

  /** willAuthError() may be provided to detect a potential operation that'll receive authentication error so that getAuth() can be run proactively. */
  willAuthError?(params: {
    authState: T | null;
    operation: Operation;
  }): boolean;

  /** getAuth() handles how the application refreshes or reauthenticates given a stale `authState` and should return a new `authState` or `null`. */
  getAuth(params: {
    authState: T | null;
    /** The mutate() method may be used to send one-off mutations to the GraphQL API for the purpose of authentication. */
    mutate<Data = any, Variables extends object = {}>(
      query: DocumentNode | string,
      variables?: Variables,
      context?: Partial<OperationContext>
    ): Promise<OperationResult<Data>>;
  }): Promise<T | null>;
}

const addAuthAttemptToOperation = (
  operation: Operation,
  hasAttempted: boolean
) => ({
  ...operation,
  context: {
    ...operation.context,
    authAttempt: hasAttempted,
  },
});

export function authExchange<T>({
  addAuthToOperation,
  getAuth,
  didAuthError,
  willAuthError,
}: AuthConfig<T>): Exchange {
  return ({ client, forward }) => {
    const retryQueue: Map<number, Operation> = new Map();
    const { source: retrySource$, next: retryOperation } = makeSubject<
      Operation
    >();

    let authState: T | null = null;

    return operations$ => {
      function mutate<Data = any, Variables extends object = {}>(
        query: DocumentNode | string,
        variables?: Variables,
        context?: Partial<OperationContext>
      ): Promise<OperationResult<Data>> {
        const operation = client.createRequestOperation(
          'mutation',
          createRequest(query, variables),
          context
        );

        return pipe(
          result$,
          onStart(() => retryOperation(operation)),
          filter(result => result.operation.key === operation.key),
          take(1),
          toPromise
        );
      }

      const updateAuthState = (newAuthState: T | null) => {
        authState = newAuthState;
        pendingPromise = undefined;
        retryQueue.forEach(retryOperation);
        retryQueue.clear();
      };

      let pendingPromise: Promise<any> | void = Promise.resolve()
        .then(() => getAuth({ authState, mutate }))
        .then(updateAuthState);

      const refreshAuth = (operation: Operation): Promise<any> => {
        // add to retry queue to try again later
        operation = addAuthAttemptToOperation(operation, true);
        retryQueue.set(operation.key, operation);

        // check that another operation isn't already doing refresh
        if (!pendingPromise) {
          pendingPromise = getAuth({ authState, mutate })
            .then(updateAuthState)
            .catch(() => updateAuthState(null));
        }

        return pendingPromise;
      };

      const sharedOps$ = pipe(operations$, share);

      const teardownOps$ = pipe(
        sharedOps$,
        filter((operation: Operation) => {
          return operation.operationName === 'teardown';
        })
      );

      const pendingOps$ = pipe(
        sharedOps$,
        filter((operation: Operation) => {
          return operation.operationName !== 'teardown';
        })
      );

      const opsWithAuth$ = pipe(
        merge([
          retrySource$,
          pipe(
            pendingOps$,
            mergeMap(operation => {
              if (
                !pendingPromise &&
                willAuthError &&
                willAuthError({ operation, authState })
              ) {
                pendingPromise = refreshAuth(operation);
              } else if (!pendingPromise) {
                return fromValue(addAuthAttemptToOperation(operation, false));
              }

              const teardown$ = pipe(
                sharedOps$,
                filter(op => {
                  return (
                    op.operationName === 'teardown' && op.key === operation.key
                  );
                })
              );

              return pipe(
                fromPromise(pendingPromise),
                map(() => addAuthAttemptToOperation(operation, false)),
                takeUntil(teardown$)
              );
            })
          ),
        ]),
        map(operation => addAuthToOperation({ operation, authState }))
      );

      const result$ = pipe(merge([opsWithAuth$, teardownOps$]), forward, share);

      return pipe(
        result$,
        filter(({ error, operation }) => {
          if (error && didAuthError && didAuthError({ error, authState })) {
            if (!operation.context.authAttempt) {
              pendingPromise = refreshAuth(operation);
              return false;
            }
          }

          return true;
        })
      );
    };
  };
}

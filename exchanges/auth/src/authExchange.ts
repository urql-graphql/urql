import {
  pipe,
  map,
  mergeMap,
  fromPromise,
  fromValue,
  filter,
  makeSubject,
  merge,
  share,
  takeUntil,
} from 'wonka';
import { Operation, CombinedError, Exchange } from 'urql';

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
  getAuth(params: { authState: T | null }): Promise<T | null>;
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
  return ({ forward }) => {
    const retryQueue: Map<number, Operation> = new Map();
    let authState: T | null = null;

    const updateAuthState = (newAuthState: T | null) => {
      authState = newAuthState;
      pendingPromise = undefined;
      retryQueue.forEach(retryOperation);
      retryQueue.clear();
    };

    let pendingPromise: Promise<any> | void = getAuth({ authState }).then(
      updateAuthState
    );

    const refreshAuth = (operation: Operation): Promise<any> => {
      // add to retry queue to try again later
      retryQueue.set(operation.key, addAuthAttemptToOperation(operation, true));

      // check that another operation isn't already doing refresh
      if (!pendingPromise) {
        pendingPromise = getAuth({ authState })
          .then(updateAuthState)
          .catch(() => updateAuthState(null));
      }

      return pendingPromise;
    };

    const { source: retrySource$, next: retryOperation } = makeSubject<
      Operation
    >();

    return operations$ => {
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

      return pipe(
        merge([opsWithAuth$, teardownOps$]),
        forward,
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

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

type AuthConfig<T> = {
  addAuthToOperation: ({
    authState,
    operation,
  }: {
    authState: T | null;
    operation: Operation;
  }) => Operation;
  didAuthError?: ({
    error,
    authState,
  }: {
    error: CombinedError;
    authState: T | null;
  }) => boolean;
  getAuth: ({ authState }: { authState: T | null }) => Promise<T | null>;
  willAuthError: ({
    operation,
    authState,
  }: {
    operation: Operation;
    authState: T | null;
  }) => boolean;
};

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
    const retryQueue: Operation[] = [];
    let authState: T | null = null;

    const updateAuthState = (newAuthState: T | null) => {
      authState = newAuthState;
      pendingPromise = undefined;
      retryQueue.forEach(retryOperation);
      retryQueue.length = 0;
    };

    let pendingPromise: Promise<any> | void = getAuth({ authState }).then(
      updateAuthState
    );

    const refreshAuth = (operation: Operation): Promise<any> => {
      // add to retry queue to try again later
      retryQueue.push(addAuthAttemptToOperation(operation, true));

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
              if (!pendingPromise && willAuthError({ operation, authState })) {
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
            const authAttempt = operation.context.authAttempt as number;
            if (!authAttempt) {
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

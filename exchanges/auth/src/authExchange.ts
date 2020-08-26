import {
  pipe,
  map,
  mergeMap,
  fromPromise,
  fromValue,
  filter,
  makeSubject,
  merge,
} from 'wonka';
import { Operation, CombinedError, Exchange } from 'urql';

type AuthConfig<T> = {
  getAuthHeader?: ({
    authState,
  }: {
    authState: T | null;
  }) => { [key: string]: string };
  addAuthToOperation?: ({
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
}: AuthConfig<T>): Exchange {
  let authState: T | null;
  let pendingPromise: Promise<any> | any;

  const initAuthState = async () => {
    if (getAuth) {
      const state = await getAuth({ authState: null });
      authState = state;
    }
    pendingPromise = undefined;
  };

  pendingPromise = initAuthState();

  const { source: retrySource$, next: retryOperation } = makeSubject<
    Operation
  >();

  return ({ forward }) => {
    const retryQueue: Operation[] = [];

    return operations$ => {
      const pendingOps$ = pipe(
        operations$,
        mergeMap((operation: Operation) => {
          const withAuthAttempt = addAuthAttemptToOperation(operation, false);

          if (withAuthAttempt.operationName !== 'teardown' && pendingPromise) {
            return pipe(
              fromPromise(pendingPromise),
              map(() => {
                if (addAuthToOperation) {
                  return addAuthToOperation({
                    operation: withAuthAttempt,
                    authState,
                  });
                }
                return withAuthAttempt;
              })
            );
          }
          if (addAuthToOperation) {
            return fromValue(
              addAuthToOperation({ operation: withAuthAttempt, authState })
            );
          }
          return fromValue(withAuthAttempt);
        })
      );

      return pipe(
        merge([pendingOps$, retrySource$]),
        forward,
        filter(({ error, operation }) => {
          if (error && didAuthError && didAuthError({ error, authState })) {
            const authAttempt = operation.context.authAttempt as number;
            if (!authAttempt) {
              // add to retry queue to try again later
              retryQueue.push(addAuthAttemptToOperation(operation, true));

              // check that another operation isn't already doing refresh
              if (!pendingPromise) {
                pendingPromise = getAuth({ authState }).then(newAuthState => {
                  authState = newAuthState;
                  pendingPromise = undefined;
                  if (!authState) {
                    retryQueue.forEach(operation => {
                      const operationWithToken = addAuthToOperation
                        ? addAuthToOperation({
                            operation,
                            authState,
                          })
                        : operation;
                      retryOperation(operationWithToken);
                    });
                  }
                });
              }

              return false;
            }
          }

          return true;
        })
      );
    };
  };
}

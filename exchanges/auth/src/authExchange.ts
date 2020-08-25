import {
  pipe,
  map,
  mergeMap,
  fromPromise,
  fromValue,
  tap,
  makeSubject,
  merge,
} from 'wonka';
import { Operation, CombinedError, Exchange } from 'urql';

type AuthConfig<T> = {
  getInitialAuthState?: () => T | Promise<T>;
  getAuthHeader?: ({
    authState,
  }: {
    authState: T;
  }) => { [key: string]: string };
  addAuthToOperation?: ({
    authState,
    operation,
  }: {
    authState: T;
    operation: Operation;
  }) => Operation;
  isAuthError?: (error: CombinedError) => boolean;
  refetchAuth?: ({
    authState,
    attempt,
  }: {
    authState: T;
    attempt: number;
  }) => Promise<T | null>;
};

const addAuthAttemptToOperation = (operation: Operation) => ({
  ...operation,
  context: {
    ...operation.context,
    authAttempt:
      typeof operation.context.authAttempt === 'number'
        ? operation.context.authAttempt + 1
        : 0,
  },
});

export function authExchange<T>({
  getInitialAuthState,
  addAuthToOperation,
  refetchAuth,
  isAuthError,
}: AuthConfig<T>): Exchange {
  let authState: T;
  let pendingPromise: Promise<any> | any;

  const initAuthState = async () => {
    if (getInitialAuthState) {
      const state = await getInitialAuthState();
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
          const withAuthAttempt = addAuthAttemptToOperation(operation);

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
        tap(async ({ error, operation }) => {
          if (error) {
            if (isAuthError && refetchAuth && isAuthError(error)) {
              // add to retry queue to try again later
              retryQueue.push(operation);

              // check that another operation isn't already doing refresh
              if (!pendingPromise) {
                pendingPromise = refetchAuth({
                  authState,
                  attempt: operation.context.authAttempt,
                });

                const newAuthState = await pendingPromise;
                authState = newAuthState;
                pendingPromise = undefined;

                retryQueue.forEach(op => {
                  const withAuthAttempt = addAuthAttemptToOperation(op);
                  const withToken = addAuthToOperation
                    ? addAuthToOperation({
                        operation: withAuthAttempt,
                        authState,
                      })
                    : withAuthAttempt;
                  retryOperation(withToken);
                });
              }
            }
          }
        })
      );
    };
  };
}

import { pipe, map, mergeMap, fromPromise, fromValue } from 'wonka';
import { Operation, CombinedError, Exchange } from 'urql';

type AuthConfig<T> = {
  getInitialAuthState?: () => T | Promise<T>;
  addAuthToOperation?: ({
    authState,
    operation,
  }: {
    authState: T;
    operation: Operation;
  }) => Operation;
  onError?: ({ error }: { error: CombinedError }) => {};
};

export function authExchange<T>({
  getInitialAuthState,
  addAuthToOperation,
}: AuthConfig<T>): Exchange {
  let authState: T;
  let pendingPromise: Promise<void> | void;

  const initAuthState = async () => {
    if (getInitialAuthState) {
      const state = await getInitialAuthState();
      authState = state;
    }
    pendingPromise = undefined;
  };

  pendingPromise = initAuthState();

  return ({ forward }) => {
    return operations$ => {
      const pendingOps$ = pipe(
        operations$,
        mergeMap((operation: Operation) => {
          if (operation.operationName !== 'teardown' && pendingPromise) {
            return pipe(
              fromPromise(pendingPromise),
              map(() => {
                if (addAuthToOperation) {
                  return addAuthToOperation({ operation, authState });
                }
                return operation;
              })
            );
          }
          if (addAuthToOperation) {
            return fromValue(addAuthToOperation({ operation, authState }));
          }
          return fromValue(operation);
        })
      );

      const operationResult$ = forward(pendingOps$);
      return operationResult$;
    };
  };
}

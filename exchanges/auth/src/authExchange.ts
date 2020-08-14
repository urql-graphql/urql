import { pipe, map, mergeMap, fromPromise, fromValue } from 'wonka';
import { Operation } from 'urql';

type AuthConfig<T> = {
  getAuthStateFromStorage?: () => T | Promise<T>;
  getAuthHeader?: ({ authState: T }) => { [key: string]: string };
};

const addHeadersToOperation = ({ operation, headers }) => {
  const fetchOptions =
    typeof operation.context.fetchOptions === 'function'
      ? operation.context.fetchOptions()
      : operation.context.fetchOptions || {};

  return {
    ...operation,
    context: {
      ...operation.context,
      fetchOptions: {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          ...(headers || {}),
        },
      },
    },
  };
};

export function authExchange<T>({
  getAuthStateFromStorage,
  getAuthHeader,
}: AuthConfig<T>) {
  let authState: T;
  let pendingPromise: Promise<void> | void;

  const initAuthState = async () => {
    if (getAuthStateFromStorage) {
      const state = await getAuthStateFromStorage();
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
                if (getAuthHeader) {
                  const headers = getAuthHeader({ authState });
                  return addHeadersToOperation({ operation, headers });
                } else {
                  return operation;
                }
              })
            );
          }
          if (getAuthHeader) {
            const headers = getAuthHeader({ authState });
            return fromValue(addHeadersToOperation({ operation, headers }));
          } else {
            return fromValue(operation);
          }
        })
      );

      const operationResult$ = forward(pendingOps$);
      return operationResult$;
    };
  };
}

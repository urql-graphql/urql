import { Exchange, formatDocument, Operation, OperationResult } from 'urql';
import { filter, map, merge, pipe, share, tap } from 'wonka';

import { query, write } from './operations';
import Store, { StoreData } from './store';

interface CacheOpts {
  initial?: StoreData;
}

type OperationMap = Map<number, Operation>;

interface DependentOperations {
  [key: string]: number[];
}

// Returns the given operation with added __typename fields on its query
const addTypeNames = (op: Operation): Operation => ({
  ...op,
  query: formatDocument(op.query),
});

// Retrieves the requestPolicy from an operation
const getRequestPolicy = (op: Operation) => op.context.requestPolicy;

// Returns whether an operation is handled by this exchange
const isQueryOperation = (op: Operation): boolean => {
  const policy = getRequestPolicy(op);
  return (
    op.operationName === 'query' &&
    (policy === 'cache-and-network' ||
      policy === 'cache-first' ||
      policy === 'cache-only')
  );
};

export const cacheExchange = ({ initial }: CacheOpts): Exchange => ({
  forward,
  client,
}) => {
  const store = new Store(initial);

  const ops: OperationMap = new Map();
  const deps = Object.create(null) as DependentOperations;

  const toNetworkOnly = (operation: Operation): Operation => ({
    ...operation,
    context: {
      ...operation.context,
      requestPolicy: 'network-only',
    },
  });

  // This accepts an array of dependencies and reexecutes all known operations
  // against the mapping of dependencies to operations
  // The passed triggerOp is ignored however
  const processDependencies = (
    triggerOp: Operation,
    dependencies: string[]
  ) => {
    const pendingOperations = new Set<number>();

    dependencies.forEach(dep => {
      const keys = deps[dep];
      if (keys !== undefined) {
        delete deps[dep];
        keys.forEach(key => pendingOperations.add(key));
      }
    });

    pendingOperations.forEach(key => {
      if (key !== triggerOp.key) {
        const op = ops.get(key) as Operation;
        ops.delete(key);
        client.reexecuteOperation(op);
      }
    });
  };

  // This updates the known dependencies for the passed operation
  const updateDependencies = (op: Operation, dependencies: string[]) => {
    dependencies.forEach(dep => {
      const keys = deps[dep] || (deps[dep] = []);
      ops.set(op.key, op);
      keys.push(op.key);
    });
  };

  const updateCacheWithResult = ({
    error,
    data,
    operation,
  }: OperationResult) => {
    if (
      (error === undefined || error.networkError === undefined) &&
      data !== null &&
      data !== undefined
    ) {
      const { dependencies } = write(store, operation, data);

      processDependencies(operation, dependencies);
      updateDependencies(operation, dependencies);
    }
  };

  return ops$ => {
    const sharedOps$ = pipe(
      ops$,
      map(addTypeNames),
      share
    );

    const query$ = pipe(
      sharedOps$,
      filter(op => isQueryOperation(op)),
      share
    );

    const cacheOnlyResult$ = pipe(
      query$,
      filter(op => getRequestPolicy(op) === 'cache-only'),
      map(
        (operation): OperationResult => {
          const { dependencies, response } = query(store, operation);
          updateDependencies(operation, dependencies);
          return { operation, data: response };
        }
      )
    );

    const cacheFirst$ = pipe(
      query$,
      filter(op => {
        const policy = getRequestPolicy(op);
        return policy === 'cache-first' || policy === 'cache-and-network';
      }),
      map(
        (operation): OperationResult => {
          const res = query(store, operation);
          if (!res.isComplete) {
            return { operation };
          }

          updateDependencies(operation, res.dependencies);
          return { operation, data: res.response };
        }
      ),
      share
    );

    const cacheFirstOps$ = pipe(
      cacheFirst$,
      filter(res => res.data === undefined && res.error === undefined),
      map(res => res.operation)
    );

    const cacheFirstResult$ = pipe(
      cacheFirst$,
      filter(res => res.data !== undefined),
      tap(({ operation }) => {
        const policy = getRequestPolicy(operation);
        if (policy === 'cache-and-network') {
          const networkOnly = toNetworkOnly(operation);
          client.reexecuteOperation(networkOnly);
        }
      })
    );

    const forwardOps$ = pipe(
      sharedOps$,
      filter(op => !isQueryOperation(op))
    );

    const result$ = pipe(
      forward(merge([forwardOps$, cacheFirstOps$])),
      tap(updateCacheWithResult)
    );

    return merge([result$, cacheOnlyResult$, cacheFirstResult$]);
  };
};

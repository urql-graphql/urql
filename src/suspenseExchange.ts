import { pipe, share, filter, merge, map, onPush } from 'wonka';
import { Exchange, OperationResult, Operation } from 'urql';

type SuspenseCache = Map<number, OperationResult>;
type SuspenseKeys = Set<number>;

const shouldSkip = ({ operationName }: Operation) =>
  operationName !== 'subscription' && operationName !== 'query';

export const suspenseExchange: Exchange = ({ client, forward }) => {
  // Warn and disable the suspenseExchange when the client's suspense mode isn't enabled
  if (!client.suspense) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[@urql/exchange-suspense]: suspensenExchange is currently disabled.\n' +
          'To use the suspense exchange with urql the Client needs to put into suspense mode.' +
          'You can do so by passing `suspense: true` when creating the client.'
      );
    }

    return ops$ => forward(ops$);
  }

  const cache = new Map() as SuspenseCache;
  const keys = new Set() as SuspenseKeys;

  const isOperationCached = (operation: Operation) => cache.has(operation.key);

  const isResultImmediate = (result: OperationResult) =>
    keys.has(result.operation.key);

  return ops$ => {
    const sharedOps$ = share(ops$);

    // Every uncached operation that isn't skipped will be marked as immediate and forwarded
    const forwardResults$ = pipe(
      sharedOps$,
      filter(op => shouldSkip(op) || !isOperationCached(op)),
      onPush(op => {
        if (!shouldSkip(op)) keys.add(op.key);
      }),
      forward,
      share
    );

    // Results that are skipped by suspense (mutations)
    const ignoredResults$ = pipe(
      forwardResults$,
      filter(res => shouldSkip(res.operation))
    );

    // Results that may have suspended since they did not resolve synchronously
    const deferredResults$ = pipe(
      forwardResults$,
      filter(
        res => !shouldSkip(res.operation) && !isOperationCached(res.operation)
      ),
      onPush((res: OperationResult) => {
        const { key } = res.operation;
        keys.delete(key);
        if (isResultImmediate(res)) {
          cache.delete(key);
        } else {
          cache.set(key, res);
        }
      })
    );

    // Every uncached operation that is returned synchronously will be unmarked so that
    // deferredResults$ ignores it
    const immediateResults$ = pipe(
      sharedOps$,
      filter(op => !shouldSkip(op) && !isOperationCached(op)),
      onPush(op => {
        if (!shouldSkip(op)) keys.delete(op.key);
      }),
      filter<any>(() => false)
    );

    // OperationResults that have been previously cached will be resolved once
    // by the suspenseExchange, and will be deleted from the cache immediately after
    const cachedResults$ = pipe(
      sharedOps$,
      filter(op => !shouldSkip(op) && isOperationCached(op)),
      map(op => {
        const { key } = op;
        const result = cache.get(key) as OperationResult;
        cache.delete(key);
        keys.delete(key);
        return result;
      })
    );

    return merge([
      ignoredResults$,
      deferredResults$,
      immediateResults$,
      cachedResults$,
    ]);
  };
};

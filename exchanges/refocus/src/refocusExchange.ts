import { pipe, tap } from 'wonka';
import { Exchange, Operation } from '@urql/core';

// Source: https://github.com/vercel/swr/blob/4d6be3df441f925d235a4b26914efcc85ae335a3/src/libs/is-document-visible.ts
const isDocumentVisible = (): boolean => {
  if (
    typeof document !== 'undefined' &&
    typeof document.visibilityState !== 'undefined'
  ) {
    return document.visibilityState !== 'hidden';
  }
  // always assume it's visible
  return true;
};

// Source: https://github.com/vercel/swr/blob/4d6be3df441f925d235a4b26914efcc85ae335a3/src/libs/is-online.ts
const isOnline = (): boolean => {
  if (typeof navigator.onLine !== 'undefined') {
    return navigator.onLine;
  }
  // always assume it's online
  return true;
};

export const refocusExchange = (): Exchange => {
  return ({ client, forward }) => ops$ => {
    const watchedOperations = new Map<number, Operation>();
    const observedOperations = new Map<number, number>();

    window.addEventListener('visibilitychange', () => {
      if (!isDocumentVisible() || !isOnline()) {
        return;
      }
      watchedOperations.forEach(op => {
        client.reexecuteOperation(
          client.createRequestOperation('query', op, {
            requestPolicy: 'cache-and-network',
          })
        );
      });
    });

    const processIncomingOperation = (op: Operation) => {
      if (op.operationName === 'query' && !observedOperations.has(op.key)) {
        observedOperations.set(op.key, 1);
        watchedOperations.set(op.key, op);
      }

      if (op.operationName === 'teardown' && observedOperations.has(op.key)) {
        observedOperations.delete(op.key);
        watchedOperations.delete(op.key);
      }
    };

    return forward(pipe(ops$, tap(processIncomingOperation)));
  };
};

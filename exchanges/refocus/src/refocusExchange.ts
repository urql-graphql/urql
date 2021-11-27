import { pipe, tap } from 'wonka';
import { Exchange, Operation } from '@urql/core';

export const refocusExchange = (): Exchange => {
  return ({ client, forward }) => ops$ => {
    if (typeof window === 'undefined') {
      return forward(ops$);
    }

    const watchedOperations = new Map<number, Operation>();
    const observedOperations = new Map<number, number>();

    window.addEventListener('visibilitychange', () => {
      if (
        typeof document !== 'object' ||
        document.visibilityState === 'visible'
      ) {
        watchedOperations.forEach(op => {
          client.reexecuteOperation(
            client.createRequestOperation('query', op, {
              ...op.context,
              requestPolicy: 'cache-and-network',
            })
          );
        });
      }
    });

    const processIncomingOperation = (op: Operation) => {
      if (op.kind === 'query' && !observedOperations.has(op.key)) {
        observedOperations.set(op.key, 1);
        watchedOperations.set(op.key, op);
      }

      if (op.kind === 'teardown' && observedOperations.has(op.key)) {
        observedOperations.delete(op.key);
        watchedOperations.delete(op.key);
      }
    };

    return forward(pipe(ops$, tap(processIncomingOperation)));
  };
};

import { pipe, tap } from 'wonka';
import { Exchange, Operation } from '@urql/core';

export const refocusExchange = (): Exchange => {
  return ({ client, forward }) => ops$ => {
    const watchedOperations = new Map<number, Operation>();
    const observedOperations = new Map<number, number>();
    const keys: Array<number> = [];

    window.addEventListener('focus', () => {
      keys.forEach(key => {
        const op = watchedOperations.get(key) as Operation;
        client.reexecuteOperation(
          client.createRequestOperation(
            'query',
            { key: op.key, query: op.query, variables: op.variables },
            { requestPolicy: 'cache-and-network' }
          )
        );
      });
    });

    const processIncomingOperation = (op: Operation) => {
      if (op.operationName !== 'query' && op.operationName !== 'teardown')
        return;

      if (op.operationName === 'query' && !observedOperations.has(op.key)) {
        observedOperations.set(op.key, 1);
        watchedOperations.set(op.key, op);
        keys.push(op.key);
      } else if (op.operationName === 'query') {
        const observedCount = observedOperations.get(op.key) as number;
        observedOperations.set(op.key, observedCount + 1);
      }

      if (op.operationName === 'teardown' && observedOperations.has(op.key)) {
        const observedCount = observedOperations.get(op.key) as number;
        if (observedCount === 1) {
          observedOperations.delete(op.key);
          watchedOperations.delete(op.key);
          keys.splice(keys.indexOf(op.key), 1);
        } else {
          observedOperations.set(op.key, observedCount - 1);
        }
      }
    };

    return forward(pipe(ops$, tap(processIncomingOperation)));
  };
};

import { pipe, tap } from 'wonka';
import { Exchange, Operation } from '@urql/core';

export const refocusExchange = (): Exchange => {
  return ({ client, forward }) => ops$ => {
    const watchedOperations = new Map<number, Operation>();
    const observedOperations = new Map<number, number>();

    window.addEventListener('focus', () => {
      watchedOperations.forEach(op => {
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

import { pipe, tap } from 'wonka';
import type { Exchange, Operation } from '@urql/core';

/** Exchange factory that reexecutes operations after a user returns to the tab.
 *
 * @returns a new refocus {@link Exchange}.
 *
 * @remarks
 * The `refocusExchange` will reexecute `Operation`s with the `cache-and-network`
 * policy when a user switches back to your application's browser tab. This can
 * effectively update all on-screen data when a user has stayed inactive for a
 * long time.
 *
 * The `cache-and-network` policy will refetch data in the background, but will
 * only refetch queries that are currently active.
 */
export const refocusExchange = (): Exchange => {
  return ({ client, forward }) =>
    ops$ => {
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

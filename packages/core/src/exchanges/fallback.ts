import { filter, pipe, tap } from 'wonka';
import { ExchangeIO, ExchangeInput } from '../types';

/** Used by the `Client` as the last exchange to warn about unhandled operations.
 *
 * @remarks
 * In a normal setup, some operations may go unhandled when a {@link Client} isn’t set up
 * with the right exchanges.
 * For instance, a `Client` may be missing a fetch exchange, or an exchange handling subscriptions.
 * This {@link Exchange} is added by the `Client` automatically to log warnings about unhandled
 * {@link Operaiton | Operations} in development.
 */
export const fallbackExchange: ({
  dispatchDebug,
}: Pick<ExchangeInput, 'dispatchDebug'>) => ExchangeIO = ({
  dispatchDebug,
}) => ops$ => {
  if (process.env.NODE_ENV !== 'production') {
    ops$ = pipe(
      ops$,
      tap(operation => {
        if (
          operation.kind !== 'teardown' &&
          process.env.NODE_ENV !== 'production'
        ) {
          const message = `No exchange has handled operations of kind "${operation.kind}". Check whether you've added an exchange responsible for these operations.`;

          dispatchDebug({
            type: 'fallbackCatch',
            message,
            operation,
          });
          console.warn(message);
        }
      })
    );
  }

  // All operations that skipped through the entire exchange chain should be filtered from the output
  return filter((_x): _x is never => false)(ops$);
};

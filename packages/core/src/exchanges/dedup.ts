import { filter, pipe, tap } from 'wonka';
import { Exchange, Operation, OperationResult } from '../types';

/** Default deduplication exchange.
 *
 * @remarks
 * The `dedupExchange` deduplicates queries and subscriptions that are
 * started with identical documents and variables by deduplicating by
 * their {@link Operation.key}.
 * This can prevent duplicate requests from being sent to your GraphQL API.
 *
 * Because this is a very safe exchange to add to any GraphQL setup, it’s
 * not only the default, but we also recommend you to always keep this
 * exchange added and included in your setup.
 *
 * Hint: In React and Vue, some common usage patterns can trigger duplicate
 * operations. For instance, in React a single render will actually
 * trigger two phases that execute an {@link Operation}.
 */
export const dedupExchange: Exchange = ({ forward, dispatchDebug }) => {
  const inFlightKeys = new Set<number>();

  const filterIncomingOperation = (operation: Operation) => {
    const { key, kind } = operation;
    if (kind === 'teardown' || kind === 'mutation') {
      inFlightKeys.delete(key);
      return true;
    }

    const isInFlight = inFlightKeys.has(key);
    inFlightKeys.add(key);

    if (isInFlight) {
      dispatchDebug({
        type: 'dedup',
        message: 'An operation has been deduped.',
        operation,
      });
    }

    return !isInFlight;
  };

  const afterOperationResult = ({ operation, hasNext }: OperationResult) => {
    if (!hasNext) {
      inFlightKeys.delete(operation.key);
    }
  };

  return ops$ => {
    const forward$ = pipe(ops$, filter(filterIncomingOperation));
    return pipe(forward(forward$), tap(afterOperationResult));
  };
};

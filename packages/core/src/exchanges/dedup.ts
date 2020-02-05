import { filter, pipe, tap } from 'wonka';
import { Exchange, Operation, OperationResult } from '../types';

/** A default exchange for debouncing GraphQL requests. */
export const dedupExchange: Exchange = ({ forward }) => {
  const inFlightKeys = new Set<number>();

  const filterIncomingOperation = (operation: Operation) => {
    const { key, operationName } = operation;
    if (operationName === 'teardown') {
      inFlightKeys.delete(key);
      return true;
    } else if (operationName !== 'query' && operationName !== 'subscription') {
      return true;
    }

    const isInFlight = inFlightKeys.has(key);
    inFlightKeys.add(key);
    return !isInFlight;
  };

  const afterOperationResult = ({ operation }: OperationResult) => {
    inFlightKeys.delete(operation.key);
  };

  return ops$ => {
    const forward$ = pipe(ops$, filter(filterIncomingOperation));
    return pipe(forward(forward$), tap(afterOperationResult));
  };
};

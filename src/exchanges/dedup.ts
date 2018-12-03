import { filter, tap } from 'rxjs/operators';
import { Exchange } from '../types';

/** A default exchange for debouncing GraphQL requests. */
export const dedupeExchange: Exchange = ({ forward }) => {
  const inFlight = new Set<string>();

  return ops$ =>
    forward(
      ops$.pipe(
        filter(({ operationName, key }) => {
          if (operationName !== 'query') {
            return true;
          }

          const hasInFlightOp = inFlight.has(key);

          if (!hasInFlightOp) {
            inFlight.add(key);
          }

          return !hasInFlightOp;
        })
      )
    ).pipe(tap(res => inFlight.delete(res.operation.key)));
};

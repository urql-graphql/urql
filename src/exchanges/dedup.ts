import { filter, pipe, tap } from 'wonka';
import { Exchange } from '../types';

/** A default exchange for debouncing GraphQL requests. */
export const dedupExchange: Exchange = ({ forward }) => {
  const inFlight = new Set<number>();

  return ops$ =>
    pipe(
      forward(
        pipe(
          ops$,
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
      ),
      tap(res => {
        inFlight.delete(res.operation.key);
      })
    );
};

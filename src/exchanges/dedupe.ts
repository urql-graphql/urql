import { tap, filter } from 'rxjs/operators';
import { Exchange } from '../types';

export const dedupeExchange: Exchange = forward => {
  const inFlight = new Set<string>();

  return ops$ =>
    forward(
      ops$.pipe(
        filter(({ key }) => {
          const hasInFlightOp = inFlight.has(key);

          if (!hasInFlightOp) {
            inFlight.add(key);
          }

          return !hasInFlightOp;
        })
      )
    ).pipe(tap(res => inFlight.delete(res.operation.key)));
};

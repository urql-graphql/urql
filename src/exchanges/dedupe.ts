import { Observable, of } from 'rxjs';
import { partition, merge, flatMap, tap } from 'rxjs/operators';
import { Exchange, ExchangeResult, Operation } from '../types';

export const dedupeExchange = (): Exchange => {
  const inFlight = new Map<Operation, Observable<ExchangeResult>>();

  return forward => ops$ => {
    const [inFlightOps$, forwardOps$] = partition<Operation>(
      operation =>
        operation.operationName !== 'mutation' && inFlight.has(operation)
    )(ops$);

    const inFlightResult$ = inFlightOps$.pipe(
      flatMap(operation => inFlight.get(operation))
    );

    const forwardResult$ = forwardOps$.pipe(
      flatMap(operation => {
        const forward$ = forward(of(operation)).pipe(
          tap(() => inFlight.delete(operation))
        );
        inFlight.set(operation, forward$);
        return forward$;
      })
    );

    return inFlightResult$.pipe(merge(forwardResult$));
  };
};

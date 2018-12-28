import { parse } from 'graphql/language/parser';
import { merge, Observable, Observer, of } from 'rxjs';
import { mergeMap, partition } from 'rxjs/operators';
import { Exchange, ExchangeResult, Operation } from '../types';

function extractOperationName(operation: Operation): Operation {
  const doc = parse(operation.query);

  // TODO: How do we enforce this? I feel like this has to be stable given the spec?
  // this is grabbing the first selection from the subscription query. Which is required to only be 1.
  // and backend servers require operationName to be the subscription name
  const operationName =
    // @ts-ignore
    doc.definitions[0].selectionSet.selections[0].name.value;

  return {
    ...operation,
    operationName,
  };
}
const liveSubscriptions = new Map<string, () => void>();

export const subscriptionExchange: Exchange = ({ forward }) => {
  const handleSubscription = (operation: Operation) => {
    if (operation.context.unsubscribe) {
      return new Observable<ExchangeResult>(observer => {
        const unsubscribe = liveSubscriptions.get(operation.query);
        // clear away queries
        liveSubscriptions.delete(operation.query);

        if (unsubscribe) {
          unsubscribe();
        }

        observer.complete();
      });
    }

    return new Observable<ExchangeResult>(observer => {
      const { unsubscribe } = operation.context.forwardSubscription(
        extractOperationName(operation),
        observer
      );

      liveSubscriptions.set(operation.query, unsubscribe);
    });
  };

  return ops$ => {
    return ops$.pipe(
      source$ =>
        of(
          partition<Operation>(op => op.operationName === 'subscription')(
            source$
          )
        ),
      // @ts-ignore
      mergeMap(([subscriptions$, operations$]) =>
        merge(
          subscriptions$.pipe(mergeMap(handleSubscription)),
          operations$.pipe(forward)
        )
      )
    );
  };
};

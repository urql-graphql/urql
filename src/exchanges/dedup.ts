import Observable from 'zen-observable-ts';

import { IExchange } from '../interfaces/index';

// Wraps an exchange and deduplicates in-flight operations by their key
export const dedupExchange = (forward: IExchange): IExchange => {
  const inFlight = {};

  return operation => {
    const { key, operationName } = operation;

    // Do not try to deduplicate mutation operations
    if (operationName === 'mutation') {
      return forward(operation);
    }

    // Take existing intermediate observable if it has been created
    if (inFlight[key] !== undefined) {
      return inFlight[key];
    }

    const forwarded$ = forward(operation);

    // Keep around one subscription and collect observers for this observable
    const observers = [];
    let refCounter = 0;
    let subscription;

    // Create intermediate observable and only forward to the next exchange once
    return (inFlight[key] = new Observable(observer => {
      refCounter++;
      observers.push(observer);

      if (subscription === undefined) {
        subscription = forwarded$.subscribe({
          complete: () => {
            delete inFlight[key];
            observers.forEach(x => x.complete());
          },
          error: error => {
            observers.forEach(x => x.error(error));
          },
          next: emission => {
            observers.forEach(x => x.next(emission));
          },
        });
      }

      return () => {
        if (--refCounter === 0) {
          delete inFlight[key];
          subscription.unsubscribe();
        }
      };
    }));
  };
};

import Observable from 'zen-observable-ts';

import { IExchange } from '../interfaces/exchange';

// Wraps an exchange and deduplicates in-flight operations by their key
export const dedupExchange = (forward: IExchange): IExchange => {
  const inFlight = {};

  return operation => {
    const { key } = operation;

    // Take existing intermediate observable if it has been created
    if (inFlight[key] !== undefined) {
      return inFlight[key];
    }

    // Keep around one subscription and collect observers for this observable
    const observers = [];
    let refCounter = 0;
    let subscription;

    // Create intermediate observable and only forward to the next exchange once
    return (inFlight[key] = new Observable(observer => {
      refCounter++;
      observers.push(observer);

      if (subscription === undefined) {
        subscription = forward(operation).subscribe({
          complete: () => {
            observers.forEach(x => x.complete());
            delete inFlight[key];
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
        refCounter--;
        if (refCounter === 0) {
          delete inFlight[key];
          if (subscription !== undefined) {
            subscription.unsubscribe();
          }
        }
      };
    }));
  };
};

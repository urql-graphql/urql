import Observable from 'zen-observable-ts';

import {
  IExchange,
  IExchangeResult,
  ISubscription,
  ISubscriptionObserver,
} from '../interfaces/index';

import { CombinedError } from './error';

export const subscriptionExchange = (
  createSubscription: (IOperation, ISubscriptionObserver) => ISubscription,
  forward: IExchange
): IExchange => {
  return operation => {
    const { operationName } = operation;

    // Forward non-subscription operations
    if (operationName !== 'subscription') {
      return forward(operation);
    }

    // Take over subscription operations and call `createSubscription`
    return new Observable<IExchangeResult>(observer => {
      const subObserver: ISubscriptionObserver = {
        error: networkError => {
          observer.error(new CombinedError({ networkError }));
        },
        next: raw => {
          const result: IExchangeResult = { data: raw.data };
          if (Array.isArray(raw.errors)) {
            result.error = new CombinedError({ graphQLErrors: raw.errors });
          }

          observer.next(result);
        },
      };

      const sub = createSubscription(operation, subObserver);

      return () => {
        sub.unsubscribe();
      };
    });
  };
};

import Observable from 'zen-observable-ts';

import {
  Exchange,
  ExchangeResult,
  Subscription,
  SubscriptionObserver,
} from '../interfaces/index';

import { CombinedError } from '../lib';

export const subscriptionExchange = (
  createSubscription: (IOperation, ISubscriptionObserver) => Subscription,
  forward: Exchange
): Exchange => {
  return operation => {
    const { operationName } = operation;

    // Forward non-subscription operations
    if (operationName !== 'subscription') {
      return forward(operation);
    }

    // Take over subscription operations and call `createSubscription`
    return new Observable<ExchangeResult>(observer => {
      const subObserver: SubscriptionObserver = {
        error: networkError => {
          observer.error(new CombinedError({ networkError }));
        },
        next: raw => {
          const result: ExchangeResult = { operation, data: raw.data };
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

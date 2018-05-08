import { ExecutionResult } from 'graphql';

// These are *not* Observable primitives, but are instead intended to
// be used with the subscriptionExchange

export interface ISubscriptionObserver {
  next: (ExecutionResult) => void;
  error: (Error) => void;
}

export interface ISubscription {
  unsubscribe: () => void;
}

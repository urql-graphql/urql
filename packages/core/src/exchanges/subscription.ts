import { print } from 'graphql';

import {
  filter,
  make,
  merge,
  mergeMap,
  pipe,
  share,
  Source,
  takeUntil,
} from 'wonka';

import { makeResult, makeErrorResult, makeOperation } from '../utils';

import {
  Exchange,
  ExecutionResult,
  Operation,
  OperationContext,
  OperationResult,
} from '../types';

export interface ObserverLike<T> {
  next: (value: T) => void;
  error: (err: any) => void;
  complete: () => void;
}

/** An abstract observable interface conforming to: https://github.com/tc39/proposal-observable */
export interface ObservableLike<T> {
  subscribe(
    observer: ObserverLike<T>
  ): {
    unsubscribe: () => void;
  };
}

export interface SubscriptionOperation {
  query: string;
  variables?: Record<string, unknown>;
  key: string;
  context: OperationContext;
}

export type SubscriptionForwarder = (
  operation: SubscriptionOperation
) => ObservableLike<ExecutionResult>;

/** This is called to create a subscription and needs to be hooked up to a transport client. */
export interface SubscriptionExchangeOpts {
  // This has been modelled to work with subscription-transport-ws
  // See: https://github.com/apollographql/subscriptions-transport-ws#requestoptions--observableexecutionresult-returns-observable-to-execute-the-operation
  forwardSubscription: SubscriptionForwarder;

  /** This flag may be turned on to allow your subscriptions-transport to handle all operation types */
  enableAllOperations?: boolean;
}

export const subscriptionExchange = ({
  forwardSubscription,
  enableAllOperations,
}: SubscriptionExchangeOpts): Exchange => ({ client, forward }) => {
  const createSubscriptionSource = (
    operation: Operation
  ): Source<OperationResult> => {
    // This excludes the query's name as a field although subscription-transport-ws does accept it since it's optional
    const observableish = forwardSubscription({
      key: operation.key.toString(36),
      query: print(operation.query),
      variables: operation.variables,
      context: { ...operation.context },
    });

    return make<OperationResult>(({ next, complete }) => {
      let isComplete = false;
      let sub;

      Promise.resolve().then(() => {
        if (isComplete) return;

        sub = observableish.subscribe({
          next: result => next(makeResult(operation, result)),
          error: err => next(makeErrorResult(operation, err)),
          complete: () => {
            if (!isComplete) {
              isComplete = true;
              if (operation.kind === 'subscription') {
                client.reexecuteOperation(
                  makeOperation('teardown', operation, operation.context)
                );
              }

              complete();
            }
          },
        });
      });

      return () => {
        isComplete = true;
        if (sub) sub.unsubscribe();
      };
    });
  };

  const isSubscriptionOperation = (operation: Operation): boolean => {
    const { kind } = operation;
    return (
      kind === 'subscription' ||
      (!!enableAllOperations && (kind === 'query' || kind === 'mutation'))
    );
  };

  return ops$ => {
    const sharedOps$ = share(ops$);
    const subscriptionResults$ = pipe(
      sharedOps$,
      filter(isSubscriptionOperation),
      mergeMap(operation => {
        const { key } = operation;
        const teardown$ = pipe(
          sharedOps$,
          filter(op => op.kind === 'teardown' && op.key === key)
        );

        return pipe(createSubscriptionSource(operation), takeUntil(teardown$));
      })
    );

    const forward$ = pipe(
      sharedOps$,
      filter(op => !isSubscriptionOperation(op)),
      forward
    );

    return merge([subscriptionResults$, forward$]);
  };
};

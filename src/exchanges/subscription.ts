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

import { CombinedError } from '../lib/error';

import {
  Exchange,
  ExchangeResult,
  ExecutionResult,
  GraphQLRequest,
  Operation,
  OperationContext,
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

export interface SubscriptionOperation extends GraphQLRequest {
  /** This does not indicate the type of GraphQL request but the name of the query in this case. */
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
}

const isSubscriptionOperation = (operation: Operation) =>
  operation.operationName === 'subscription';

export const subscriptionExchange = ({
  forwardSubscription,
}: SubscriptionExchangeOpts): Exchange => ({ forward }) => {
  const createSubscriptionSource = (
    operation: Operation
  ): Source<ExchangeResult> => {
    // This excludes the query's name as a field although subscription-transport-ws does accept it since it's optional
    const observableish = forwardSubscription({
      key: operation.key,
      query: operation.query,
      variables: operation.variables,
      context: { ...operation.context },
    });

    return make<ExchangeResult>(([next, complete]) => {
      // TODO: The conversion of the result here is very similar to fetch;
      // We can maybe extract the logic into generic GraphQL utilities
      const sub = observableish.subscribe({
        next: result =>
          next({
            operation,
            data: result.data || undefined,
            error: Array.isArray(result.errors)
              ? new CombinedError({
                  graphQLErrors: result.errors,
                  response: undefined,
                })
              : undefined,
          }),
        error: err =>
          next({
            operation,
            data: undefined,
            error: new CombinedError({
              networkError: err,
              response: undefined,
            }),
          }),
        complete,
      });

      // NOTE: Destructuring sub is avoided here to preserve its potential binding
      return () => sub.unsubscribe();
    });
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
          filter(op => op.operationName === 'teardown' && op.key === key)
        );

        return pipe(
          createSubscriptionSource(operation),
          takeUntil(teardown$)
        );
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

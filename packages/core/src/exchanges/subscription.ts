import {
  filter,
  make,
  merge,
  mergeMap,
  pipe,
  Subscription,
  Source,
  takeUntil,
} from 'wonka';

import {
  makeResult,
  mergeResultPatch,
  makeErrorResult,
  makeOperation,
} from '../utils';

import {
  Exchange,
  ExecutionResult,
  Operation,
  OperationResult,
} from '../types';

import { FetchBody, makeFetchBody } from '../internal';

/** An abstract observer-like interface.
 *
 * @remarks
 * Observer-like interfaces are passed to {@link ObservableLike.subscribe} to provide them
 * with callbacks for their events.
 *
 * @see {@link https://github.com/tc39/proposal-observable} for the full TC39 Observable proposal.
 */
export interface ObserverLike<T> {
  /** Callback for values an {@link ObservableLike} emits. */
  next: (value: T) => void;
  /** Callback for an error an {@link ObservableLike} emits, which ends the subscription. */
  error: (err: any) => void;
  /** Callback for the completion of an {@link ObservableLike}, which ends the subscription. */
  complete: () => void;
}

/** An abstract observable-like interface.
 *
 * @remarks
 * Observable, or Observable-like interfaces, are often used by GraphQL transports to abstract
 * how they send {@link ExecutionResult | ExecutionResults} to consumers. These generally contain
 * a `subscribe` method accepting an {@link ObserverLike} structure.
 *
 * @see {@link https://github.com/tc39/proposal-observable} for the full TC39 Observable proposal.
 */
export interface ObservableLike<T> {
  /** Start the Observable-like subscription and returns a subscription handle.
   *
   * @param observer - an {@link ObserverLike} object with result, error, and completion callbacks.
   * @returns a subscription handle providing an `unsubscribe` method to stop the subscription.
   */
  subscribe(observer: ObserverLike<T>): {
    unsubscribe: () => void;
  };
}

/** A more cross-compatible version of the {@link GraphQLRequest} structure.
 * {@link FetchBody} for more details
 */
export type SubscriptionOperation = FetchBody;

/** A subscription forwarding function, which must accept a {@link SubscriptionOperation}.
 *
 * @param operation - A {@link SubscriptionOperation}
 * @returns An {@link ObservableLike} object issuing {@link ExecutionResult | ExecutionResults}.
 */
export type SubscriptionForwarder = (
  request: FetchBody,
  operation: Operation
) => ObservableLike<ExecutionResult>;

/** This is called to create a subscription and needs to be hooked up to a transport client. */
export interface SubscriptionExchangeOpts {
  /** A subscription forwarding function, which must accept a {@link SubscriptionOperation}.
   *
   * @param operation - A {@link SubscriptionOperation}
   * @returns An {@link ObservableLike} object issuing {@link ExecutionResult | ExecutionResults}.
   *
   * @remarks
   * This callback is called for each {@link Operation} that this `subscriptionExchange` will
   * handle. It receives the {@link SubscriptionOperation}, which is a more compatible version
   * of the raw {@link Operation} objects and must return an {@link ObservableLike} of results.
   */
  forwardSubscription: SubscriptionForwarder;

  /** Flag to enable this exchange to handle all types of GraphQL operations.
   *
   * @remarks
   * When you aren’t using fetch exchanges and GraphQL over HTTP as a transport for your GraphQL requests,
   * or you have a third-party GraphQL transport implementation, which must also be used for queries and
   * mutations, this flag may be used to allow this exchange to handle all kinds of GraphQL operations.
   *
   * By default, this flag is `false` and the exchange will only handle GraphQL subscription operations.
   */
  enableAllOperations?: boolean;

  /** A predicate function that causes an operation to be handled by this `subscriptionExchange` if `true` is returned.
   *
   * @param operation - an {@link Operation}
   * @returns true when the operation is handled by this exchange.
   *
   * @remarks
   * In some cases, a `subscriptionExchange` will be used to only handle some {@link Operation | Operations},
   * e.g. all that contain `@live` directive. For these cases, this function may be passed to precisely
   * determine which `Operation`s this exchange should handle, instead of forwarding.
   *
   * When specified, the {@link SubscriptionExchangeOpts.enableAllOperations} flag is disregarded.
   */
  isSubscriptionOperation?: (operation: Operation) => boolean;
}

/** Generic subscription exchange factory used to either create an exchange handling just subscriptions or all operation kinds.
 *
 * @remarks
 * `subscriptionExchange` can be used to create an {@link Exchange} that either
 * handles just GraphQL subscription operations, or optionally all operations,
 * when the {@link SubscriptionExchangeOpts.enableAllOperations} flag is passed.
 *
 * The {@link SubscriptionExchangeOpts.forwardSubscription} function must
 * be provided and provides a generic input that's based on {@link Operation}
 * but is compatible with many libraries implementing GraphQL request or
 * subscription interfaces.
 */
export const subscriptionExchange =
  ({
    forwardSubscription,
    enableAllOperations,
    isSubscriptionOperation,
  }: SubscriptionExchangeOpts): Exchange =>
  ({ client, forward }) => {
    const createSubscriptionSource = (
      operation: Operation
    ): Source<OperationResult> => {
      const observableish = forwardSubscription(
        makeFetchBody(operation),
        operation
      );

      return make<OperationResult>(({ next, complete }) => {
        let isComplete = false;
        let sub: Subscription | void;
        let result: OperationResult | void;

        Promise.resolve().then(() => {
          if (isComplete) return;

          sub = observableish.subscribe({
            next(nextResult) {
              next(
                (result = result
                  ? mergeResultPatch(result, nextResult)
                  : makeResult(operation, nextResult))
              );
            },
            error(error) {
              next(makeErrorResult(operation, error));
            },
            complete() {
              if (!isComplete) {
                isComplete = true;
                if (operation.kind === 'subscription') {
                  client.reexecuteOperation(
                    makeOperation('teardown', operation, operation.context)
                  );
                }

                if (result && result.hasNext)
                  next(mergeResultPatch(result, { hasNext: false }));
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
    const isSubscriptionOperationFn =
      isSubscriptionOperation ||
      (operation => {
        const { kind } = operation;
        return (
          kind === 'subscription' ||
          (!!enableAllOperations && (kind === 'query' || kind === 'mutation'))
        );
      });

    return ops$ => {
      const subscriptionResults$ = pipe(
        ops$,
        filter(isSubscriptionOperationFn),
        mergeMap(operation => {
          const { key } = operation;
          const teardown$ = pipe(
            ops$,
            filter(op => op.kind === 'teardown' && op.key === key)
          );

          return pipe(
            createSubscriptionSource(operation),
            takeUntil(teardown$)
          );
        })
      );

      const forward$ = pipe(
        ops$,
        filter(op => !isSubscriptionOperationFn(op)),
        forward
      );

      return merge([subscriptionResults$, forward$]);
    };
  };

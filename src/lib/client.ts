import { Observable, Subject, Subscription as RxSubscription } from 'rxjs';
import { filter, publish, take } from 'rxjs/operators';
import * as uuid from 'uuid';
import {
  cacheExchange,
  dedupeExchange,
  fetchExchange,
  subscriptionExchange,
} from '../exchanges';
import { CombinedError, hashString } from '../lib';
import {
  Client,
  ClientInstance,
  ClientOptions,
  CreateClientInstanceOpts,
  Exchange,
  ExchangeResult,
  Mutation,
  Operation,
  OperationType,
  Query,
  Subscription,
  SubscriptionStreamUpdate,
} from '../types';

const defaultExchanges = [
  subscriptionExchange,
  dedupeExchange,
  cacheExchange,
  fetchExchange,
];

/** Function for creating an application wide [Client]{@link Client}. */
export const createClient = (opts: ClientOptions): Client => {
  /** Cache of all instance subscriptions */
  const subscriptions = new Map<string, Map<string, RxSubscription>>();
  const querySubscriptions = new Map<string, Subject<Operation>>();

  const subject = new Subject<Operation>();

  /** Main subject stream for listening to operation responses */
  const subject$ = publish<ExchangeResult>()(
    pipeExchanges(
      opts.exchanges !== undefined ? opts.exchanges : defaultExchanges,
      subject
    )(subject)
  );

  subject$.connect();

  const fetchOptions =
    typeof opts.fetchOptions === 'function'
      ? opts.fetchOptions()
      : opts.fetchOptions;

  /** Convert a query to an operation type */
  const createOperation = (
    type: OperationType,
    query: Query,
    options: object = {}
  ) => ({
    ...query,
    key: hashString(JSON.stringify(query)),
    operationName: type,
    context: {
      url: opts.url,
      fetchOptions,
      forwardSubscription: opts.forwardSubscription,
      ...options,
    },
  });

  const executeOperation = (operation: Operation, sub: Subject<Operation>) =>
    sub.next(operation);

  /** Function to manage subscriptions on a Consumer by Consumer basis */
  const createInstance = (
    instanceOpts: CreateClientInstanceOpts
  ): ClientInstance => {
    const id = uuid.v4();

    const getRxSubscriptions = () =>
      subscriptions.has(id)
        ? (subscriptions.get(id) as Map<string, RxSubscription>)
        : new Map<string, RxSubscription>();

    const updateRxSubscriptions = (subs: Map<string, RxSubscription>) =>
      subscriptions.set(id, subs);

    const executeQuery = (query: Query, force?: boolean) => {
      const operation = createOperation(OperationType.Query, query, { force });

      const outboundKey = `${operation.key}-out`;
      const inboundKey = `${operation.key}-in`;

      const instanceRxSubscriptions = getRxSubscriptions();
      if (!instanceRxSubscriptions.has(outboundKey)) {
        /** Notify component when fetching query is occurring */
        const outboundSub = subject
          .pipe(filter(newOp => newOp.key === operation.key))
          .subscribe(instanceOpts.onChange({ fetching: true }));

        instanceRxSubscriptions.set(outboundKey, outboundSub);
      }

      if (!instanceRxSubscriptions.has(inboundKey)) {
        /** Notify component when query operation has returned */
        const inboundSub = subject$
          .pipe(filter(result => result.operation.key === operation.key))
          .subscribe(response => {
            instanceOpts.onChange({
              data: response.data,
              error: response.error,
              fetching: false,
            });
          });
        instanceRxSubscriptions.set(inboundKey, inboundSub);
      }

      updateRxSubscriptions(instanceRxSubscriptions);
      executeOperation(operation, subject);
    };

    const executeMutation = (query: Mutation) => {
      const operation = createOperation(OperationType.Mutation, query);
      subject
        .pipe(
          take(1),
          filter(incomingOp => incomingOp.key === operation.key)
        )
        .subscribe();

      executeOperation(operation, subject);
    };

    const executeSubscription = (query: Subscription) => {
      const operation = createOperation(OperationType.Subscription, query);
      const subscriptionSubject = new Subject<Operation>();

      querySubscriptions.set(query.query, subscriptionSubject);

      /** Notify component when subscription operation has been given a value */
      subscriptionSubject
        .pipe(
          pipeExchanges(
            opts.exchanges !== undefined ? opts.exchanges : defaultExchanges,
            subject
          )
        )
        .subscribe((response: SubscriptionStreamUpdate) => {
          instanceOpts.onSubscriptionUpdate({
            data: response.data.data,
            error: Array.isArray(response.data.errors)
              ? new CombinedError({
                  graphQLErrors: response.data.errors,
                  response,
                })
              : response.error,
          });
        });

      executeOperation(operation, subscriptionSubject);
    };

    const executeUnsubscribeSubscription = (query: Subscription) => {
      const operation = createOperation(OperationType.Subscription, query, {
        unsubscribe: true,
      });

      // remove cached rx subscription
      const activeSubscriptionSubject = querySubscriptions.get(query.query);

      if (activeSubscriptionSubject !== undefined) {
        querySubscriptions.delete(query.query);
        executeOperation(operation, activeSubscriptionSubject);

        // This removes the previous existence of a subscription from being part of the subject
        // without this, any unsubscribe -> subscribe will have an n^2 effect.
        activeSubscriptionSubject.unsubscribe();
      }
    };

    const unsubscribe = () => {
      const subs = getRxSubscriptions();
      if (subs === undefined) {
        return;
      }

      [...subs.values()].forEach(sub => sub.unsubscribe());
    };

    return {
      executeQuery,
      executeMutation,
      executeSubscription,
      executeUnsubscribeSubscription,
      unsubscribe,
    };
  };

  return {
    createInstance,
  };
};

/** Create pipe of exchanges */
const pipeExchanges = (exchanges: Exchange[], subject: Subject<Operation>) => (
  operation$: Observable<Operation>
) => {
  /** Recursively pipe to each exchange */
  const callExchanges = (value: Observable<Operation>, index: number = 0) => {
    if (exchanges.length < index) {
      return value;
    }

    const currentExchange = exchanges[index];
    return currentExchange({
      forward: val => callExchanges(val, index + 1),
      subject,
    })(value);
  };

  return callExchanges(operation$, 0);
};

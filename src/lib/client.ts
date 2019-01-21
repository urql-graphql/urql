import {
  filter,
  makeSubject,
  pipe,
  publish,
  share,
  Source,
  Subject,
  subscribe,
  take,
} from 'wonka';

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

type SubscriptionMap = Map<string, () => void>;

const defaultExchanges = [dedupeExchange, cacheExchange, fetchExchange];

/** Function for creating an application wide [Client]{@link Client}. */
export const createClient = (opts: ClientOptions): Client => {
  /** Cache of all instance subscriptions */
  const subscriptions = new Map<string, SubscriptionMap>();
  const querySubscriptions = new Map<string, SubscriptionMap>();

  /** Main subject for emitting operations */
  const subject = makeSubject<Operation>();

  const exchanges =
    opts.exchanges !== undefined ? opts.exchanges : defaultExchanges;

  /** Main subject stream for listening to operation responses */
  const subject$ = pipe(
    subject[0],
    pipeExchanges(exchanges, subject),
    share
  );

  publish(subject$);

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

  const executeOperation = (operation: Operation) => subject[1](operation);

  /** Function to manage subscriptions on a Consumer by Consumer basis */
  const createInstance = (
    instanceOpts: CreateClientInstanceOpts
  ): ClientInstance => {
    const id = uuid.v4();

    const getSubscriptions = () =>
      subscriptions.has(id) ? subscriptions.get(id) : (new Map() as SubscriptionMap);

    const updateSubscriptions = (subs: SubscriptionMap) =>
      subscriptions.set(id, subs);

    const executeQuery = (query: Query, force?: boolean) => {
      const operation = createOperation(OperationType.Query, query, { force });

      const outboundKey = `${operation.key}-out`;
      const inboundKey = `${operation.key}-in`;

      const instanceSubscriptions = getSubscriptions();
      if (!instanceSubscriptions.has(outboundKey)) {
        /** Notify component when fetching query is occurring */
        const [outboundSub] = pipe(
          subject[0],
          filter(op => op.key === operation.key),
          subscribe(() => instanceOpts.onChange({ fetching: true }))
        );

        instanceSubscriptions.set(outboundKey, outboundSub);
      }

      if (!instanceSubscriptions.has(inboundKey)) {
        /** Notify component when query operation has returned */
        const [inboundSub] = pipe(
          subject$,
          filter(result => result.operation.key === operation.key),
          subscribe(response => {
            instanceOpts.onChange({
              data: response.data,
              error: response.error,
              fetching: false,
            });
          })
        );

        instanceSubscriptions.set(inboundKey, inboundSub);
      }

      updateSubscriptions(instanceSubscriptions);
      executeOperation(operation);
    };

    const executeMutation = (query: Mutation) => {
      const operation = createOperation(OperationType.Mutation, query);
      executeOperation(operation);
    };

    const executeSubscription = (query: Subscription) => {
      const operation = createOperation(OperationType.Subscription, query);
      const subscriptionSubject = makeSubject<Operation>();

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

      executeOperation(operation);
    };

    const executeUnsubscribeSubscription = (query: Subscription) => {
      const operation = createOperation(OperationType.Subscription, query, {
        unsubscribe: true,
      });

      // remove cached rx subscription
      const activeSubscriptionSubject = querySubscriptions.get(query.query);

      if (activeSubscriptionSubject !== undefined) {
        querySubscriptions.delete(query.query);
        executeOperation(operation);

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

      [...subs.values()].forEach(unsub => unsub());
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
  operation$: Source<Operation>
): Source<ExchangeResult> => {
  /** Recursively pipe to each exchange */
  const callExchanges = (value: Source<Operation>, index: number = 0) => {
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

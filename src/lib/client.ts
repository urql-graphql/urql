import { Observable, Subject, Subscription } from 'rxjs';
import { filter, publish, take } from 'rxjs/operators';
import * as uuid from 'uuid';
import { cacheExchange, dedupeExchange, fetchExchange } from '../exchanges';
import { hashString } from '../lib';
import {
  Client,
  ClientInstance,
  ClientOptions,
  CreateClientInstanceOpts,
  Exchange,
  ExchangeResult,
  Mutation,
  Operation,
  Query,
} from '../types';

const defaultExchanges = [dedupeExchange, cacheExchange, fetchExchange];

/** Function for creating an application wide [Client]{@link Client}. */
export const createClient = (opts: ClientOptions): Client => {
  /** Cache of all instance subscriptions */
  const subscriptions = new Map<string, Map<string, Subscription>>();

  /** Main subject for emitting operations */
  const subject = new Subject<Operation>();

  /** Main subject stream for listening to operation responses */
  const subject$ = publish()(
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
    type: string,
    query: Query,
    force: boolean = false
  ) => ({
    ...query,
    key: hashString(JSON.stringify(query)),
    operationName: type,
    context: {
      url: opts.url,
      fetchOptions,
      force,
    },
  });

  const executeOperation = (operation: Operation) => subject.next(operation);

  /** Function to manage subscriptions on a Consumer by Consumer basis */
  const createInstance = (
    instanceOpts: CreateClientInstanceOpts
  ): ClientInstance => {
    const id = uuid.v4();

    const getSubscriptions = () =>
      subscriptions.has(id)
        ? subscriptions.get(id)
        : new Map<string, Subscription>();

    const updateSubscriptions = (subs: Map<string, Subscription>) =>
      subscriptions.set(id, subs);

    const executeQuery = (query: Query, force?: boolean) => {
      const operation = createOperation('query', query, force);

      const outboundKey = `${operation.key}-out`;
      const inboundKey = `${operation.key}-in`;

      const instanceSubscriptions = new Map(); // getSubscriptions();

      if (!instanceSubscriptions.has(outboundKey)) {
        /** Notify component when fetching query is occurring */
        const outboundSub = subject
          .pipe(filter(newOp => newOp.key === operation.key))
          .subscribe(instanceOpts.onChange({ fetching: true }));

        instanceSubscriptions.set(outboundKey, outboundSub);
      }

      if (!instanceSubscriptions.has(inboundKey)) {
        /** Notify component when query operation has returned */
        const inboundSub = subject$
          .pipe(
            filter((result: ExchangeResult) => {
              return result.operation.key === operation.key;
            })
          )
          .subscribe(response => {
            instanceOpts.onChange({
              data: response.data,
              error: response.error,
              fetching: false,
            });
          });
        instanceSubscriptions.set(inboundKey, inboundSub);
      }

      updateSubscriptions(instanceSubscriptions);
      executeOperation(operation);
    };

    const executeMutation = (query: Mutation) => {
      const operation = createOperation('mutation', query);
      subject
        .pipe(
          take(1),
          filter(incomingOp => incomingOp.key === operation.key)
        )
        .subscribe();

      executeOperation(operation);
    };

    const unsubscribe = () => {
      const subs = getSubscriptions();
      [...subs.values()].forEach(sub => sub.unsubscribe());
    };

    return {
      executeQuery,
      executeMutation,
      unsubscribe,
    };
  };

  return {
    createInstance,
  };
};

/** Create pipe of exchanges */
const pipeExchanges = (exchanges: Exchange[], subject?: Subject<Operation>) => (
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

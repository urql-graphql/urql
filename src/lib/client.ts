import { Subject, Observable, Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import * as uuid from 'uuid';
import { cacheExchange, dedupeExchange, fetchExchange } from '../exchanges';
import { hashString } from '../lib';
import {
  Client,
  ClientOptions,
  CreateClientInstanceOpts,
  Operation,
  ExchangeResult,
  Exchange,
  Query,
  Mutation,
  ClientInstance,
} from '../types';

const defaultExchanges = [dedupeExchange, cacheExchange, fetchExchange];

export const createClient = (opts: ClientOptions): Client => {
  /** Cache of all instance subscriptions */
  const subscriptions = new Map<string, Subscription[]>();

  /** Main subject for emitting operations */
  const subject = new Subject<Operation>();
  /** Main subject stream for listening to operation responses */
  const subject$ = subject.pipe(
    pipeExchanges(
      opts.exchanges !== undefined ? opts.exchanges : defaultExchanges,
      subject
    )
  );

  const fetchOptions =
    typeof opts.fetchOptions === 'function'
      ? opts.fetchOptions()
      : opts.fetchOptions !== undefined ? opts.fetchOptions : {};

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

  /** Get a subject stream that only contains responses for the given operation */
  const filterResponseByOperation = (operation: Operation) => {
    return subject$.pipe(
      take(1),
      filter((result: ExchangeResult) => result.operation.key === operation.key)
    );
  };

  /** Get a subject stream that only contains triggered operations for the given operation id */
  const filterOperationById = (operation: Operation) => {
    return subject.pipe(
      take(1),
      filter((newOp: Operation) => newOp.key === operation.key)
    );
  };

  const executeOperation = (operation: Operation) => subject.next(operation);

  /** Function to manage subscriptions on a Consumer by Consumer basis */
  const createInstance = (
    instanceOpts: CreateClientInstanceOpts
  ): ClientInstance => {
    const id = uuid.v4();

    /** Add subscription to instance map */
    const storeSubscription = (...sub: Subscription[]) => {
      const existingSubs = subscriptions.get(id);

      subscriptions.set(
        id,
        existingSubs === undefined ? sub : [...existingSubs, ...sub]
      );
    };

    const executeQuery = (query: Query, force?: boolean) => {
      const operation = createOperation('query', query, force);

      /** Notify component when fetching query is occurring */
      const outboundOp$ = filterOperationById(operation).subscribe(
        instanceOpts.onChange({ fetching: true })
      );

      /** Notify component when query operation has returned */
      const inboundOp$ = filterResponseByOperation(operation).subscribe(
        response =>
          instanceOpts.onChange({
            data: response.data,
            error: response.error,
            fetching: false,
          })
      );

      storeSubscription(inboundOp$, outboundOp$);
      executeOperation(operation);
    };

    const executeMutation = (query: Mutation) => {
      const operation = createOperation('mutation', query);
      const subscription = filterResponseByOperation(operation).subscribe();

      storeSubscription(subscription);
      executeOperation(operation);
    };

    const unsubscribe = () => {
      const subs = subscriptions.get(id);
      subs.forEach(sub => sub.unsubscribe());
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
  operation: Observable<Operation>
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

  return callExchanges(operation, 0);
};

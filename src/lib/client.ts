import { filter, makeSubject, pipe, share, Source, take, tapAll } from 'wonka';
import { composeExchanges, defaultExchanges } from '../exchanges';
import { hashString } from './hash';

import {
  Exchange,
  ExchangeResult,
  GraphqlMutation,
  GraphqlQuery,
  GraphQLRequest,
  GraphqlSubscription,
  Operation,
  OperationContext,
  OperationType,
} from '../types';

/** Options for configuring the URQL [client]{@link Client}. */
export interface ClientOptions {
  /** Target endpoint URL such as `https://my-target:8080/graphql`. */
  url: string;
  /** Any additional options to pass to fetch. */
  fetchOptions?: RequestInit | (() => RequestInit);
  /** An ordered array of Exchanges. */
  exchanges?: Exchange[];
}

interface ActiveResultSources {
  [operationKey: string]: Source<ExchangeResult>;
}

export const createClient = (opts: ClientOptions) => new Client(opts);

/** The URQL application-wide client library. Each execute method starts a GraphQL request and returns a stream of results. */
export class Client implements ClientOptions {
  // These are variables derived from ClientOptions
  url: string;
  fetchOptions: RequestInit;
  exchanges: Exchange[];

  // These are internals to be used to keep track of operations
  dispatchOperation: (operation: Operation) => void;
  operations$: Source<Operation>;
  results$: Source<ExchangeResult>;
  activeResultSources = Object.create(null) as ActiveResultSources;

  constructor(opts: ClientOptions) {
    this.url = opts.url;

    this.fetchOptions =
      typeof opts.fetchOptions === 'function'
        ? opts.fetchOptions()
        : opts.fetchOptions || {};

    this.exchanges =
      opts.exchanges !== undefined ? opts.exchanges : defaultExchanges;

    // This subject forms the input of operations; executeOperation may be
    // called to dispatch a new operation on the subject
    const [operations$, nextOperation] = makeSubject<Operation>();
    this.operations$ = operations$;
    this.dispatchOperation = nextOperation;

    // All operations run through the exchanges in a pipeline-like fashion
    // and this observable then combines all their results
    this.results$ = share(
      composeExchanges(this, this.exchanges)(this.operations$)
    );
  }

  private createOperationContext = (
    opts?: Partial<OperationContext>
  ): OperationContext => ({
    url: this.url,
    fetchOptions: this.fetchOptions,
    ...opts,
  });

  private createRequestOperation = (
    type: OperationType,
    query: GraphQLRequest,
    opts?: Partial<OperationContext>
  ): Operation => ({
    ...query,
    key: hashString(JSON.stringify(query)),
    operationName: type,
    context: this.createOperationContext(opts),
  });

  /** Deletes an active operation's result observable and sends a teardown signal through the exchange pipeline */
  private teardownOperation(operation: Operation) {
    delete this.activeResultSources[operation.key];
    this.dispatchOperation({ ...operation, operationName: 'teardown' });
  }

  /** Executes an Operation by sending it through the exchange pipeline It returns an observable that emits all related exchange results and keeps track of this observable's subscribers. A teardown signal will be emitted when no subscribers are listening anymore. */
  executeRequestOperation(operation: Operation): Source<ExchangeResult> {
    const { key, operationName } = operation;

    const operationResults$ = pipe(
      this.results$,
      filter(res => res.operation.key === key)
    );

    if (operationName === 'mutation') {
      // A mutation is always limited to just a single result and is never shared
      return pipe(
        operationResults$,
        tapAll<ExchangeResult>(
          () => this.dispatchOperation(operation),
          () => {
            /* noop */
          },
          () => {
            /* noop */
          }
        ),
        take(1)
      );
    }

    if (key in this.activeResultSources) {
      // Reuse active result observable when it's available
      return this.activeResultSources[key];
    }

    return (this.activeResultSources[key] = pipe(
      operationResults$,
      tapAll<ExchangeResult>(
        () => this.dispatchOperation(operation),
        () => {
          /* noop */
        },
        () => this.teardownOperation(operation)
      ),
      share
    ));
  }

  reexecuteOperation = (operation: Operation) => {
    // Reexecute operation only if any subscribers are still subscribed to the
    // operation's exchange results
    if (this.activeResultSources[operation.key] !== undefined) {
      this.dispatchOperation(operation);
    }
  };

  executeQuery = (
    query: GraphqlQuery,
    opts?: Partial<OperationContext>
  ): Source<ExchangeResult> => {
    const operation = this.createRequestOperation('query', query, opts);
    return this.executeRequestOperation(operation);
  };

  executeSubscription = (
    query: GraphqlSubscription,
    opts?: Partial<OperationContext>
  ): Source<ExchangeResult> => {
    const operation = this.createRequestOperation('subscription', query, opts);
    return this.executeRequestOperation(operation);
  };

  executeMutation = (
    query: GraphqlMutation,
    opts?: Partial<OperationContext>
  ): Source<ExchangeResult> => {
    const operation = this.createRequestOperation('mutation', query, opts);
    return this.executeRequestOperation(operation);
  };
}

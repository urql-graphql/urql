/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  filter,
  makeSubject,
  onEnd,
  onStart,
  pipe,
  share,
  Source,
  take,
  takeUntil,
  merge,
  interval,
  fromValue,
  switchMap,
} from 'wonka';

import {
  composeExchanges,
  defaultExchanges,
  fallbackExchangeIO,
} from './exchanges';

import {
  Exchange,
  GraphQLRequest,
  Operation,
  OperationContext,
  OperationResult,
  OperationType,
  RequestPolicy,
  PromisifiedSource,
} from './types';

import { createRequest, toSuspenseSource, withPromise } from './utils';
import { DocumentNode } from 'graphql';

/** Options for configuring the URQL [client]{@link Client}. */
export interface ClientOptions {
  /** Target endpoint URL such as `https://my-target:8080/graphql`. */
  url: string;
  /** Any additional options to pass to fetch. */
  fetchOptions?: RequestInit | (() => RequestInit);
  /** An alternative fetch implementation. */
  fetch?: typeof fetch;
  /** An ordered array of Exchanges. */
  exchanges?: Exchange[];
  /** Activates support for Suspense. */
  suspense?: boolean;
  /** The default request policy for requests. */
  requestPolicy?: RequestPolicy;
}

interface ActiveOperations {
  [operationKey: string]: number;
}

export const createClient = (opts: ClientOptions) => new Client(opts);

/** The URQL application-wide client library. Each execute method starts a GraphQL request and returns a stream of results. */
export class Client {
  // These are variables derived from ClientOptions
  url: string;
  fetch?: typeof fetch;
  fetchOptions?: RequestInit | (() => RequestInit);
  exchange: Exchange;
  suspense: boolean;
  requestPolicy: RequestPolicy;

  // These are internals to be used to keep track of operations
  dispatchOperation: (operation: Operation) => void;
  operations$: Source<Operation>;
  results$: Source<OperationResult>;
  activeOperations = Object.create(null) as ActiveOperations;

  constructor(opts: ClientOptions) {
    this.url = opts.url;
    this.fetchOptions = opts.fetchOptions;
    this.fetch = opts.fetch;
    this.suspense = !!opts.suspense;
    this.requestPolicy = opts.requestPolicy || 'cache-first';

    // This subject forms the input of operations; executeOperation may be
    // called to dispatch a new operation on the subject
    const [operations$, nextOperation] = makeSubject<Operation>();
    this.operations$ = operations$;

    // Internally operations aren't always dispatched immediately
    // Since exchanges can dispatch and reexecute operations themselves,
    // if we're inside an exchange we instead queue the operation and flush
    // them in order after
    const queuedOperations: Operation[] = [];
    let isDispatching = false;

    this.dispatchOperation = (operation: Operation) => {
      queuedOperations.push(operation);
      if (!isDispatching) {
        isDispatching = true;
        let queued;
        while ((queued = queuedOperations.shift()) !== undefined)
          nextOperation(queued);
        isDispatching = false;
      }
    };

    const exchanges =
      opts.exchanges !== undefined ? opts.exchanges : defaultExchanges;

    // All exchange are composed into a single one and are called using the constructed client
    // and the fallback exchange stream
    this.exchange = composeExchanges(exchanges);

    // All operations run through the exchanges in a pipeline-like fashion
    // and this observable then combines all their results
    this.results$ = share(
      this.exchange({
        client: this,
        forward: fallbackExchangeIO,
      })(this.operations$)
    );
  }

  private createOperationContext = (
    opts?: Partial<OperationContext>
  ): OperationContext => {
    const { requestPolicy = this.requestPolicy } = opts || {};

    return {
      url: this.url,
      fetchOptions: this.fetchOptions,
      fetch: this.fetch,
      ...opts,
      requestPolicy,
    };
  };

  createRequestOperation = (
    type: OperationType,
    { key, query, variables }: GraphQLRequest,
    opts?: Partial<OperationContext>
  ): Operation => ({
    key,
    query,
    variables,
    operationName: type,
    context: this.createOperationContext(opts),
  });

  /** Counts up the active operation key and dispatches the operation */
  private onOperationStart(operation: Operation) {
    const { key } = operation;
    this.activeOperations[key] = (this.activeOperations[key] || 0) + 1;
    this.dispatchOperation(operation);
  }

  /** Deletes an active operation's result observable and sends a teardown signal through the exchange pipeline */
  private onOperationEnd(operation: Operation) {
    const { key } = operation;
    const prevActive = this.activeOperations[key] || 0;
    const newActive = (this.activeOperations[key] =
      prevActive <= 0 ? 0 : prevActive - 1);

    if (newActive <= 0) {
      this.dispatchOperation({ ...operation, operationName: 'teardown' });
    }
  }

  /** Executes an Operation by sending it through the exchange pipeline It returns an observable that emits all related exchange results and keeps track of this observable's subscribers. A teardown signal will be emitted when no subscribers are listening anymore. */
  executeRequestOperation(operation: Operation): Source<OperationResult> {
    const { key, operationName } = operation;
    const operationResults$ = pipe(
      this.results$,
      filter(res => res.operation.key === key)
    );

    if (operationName === 'mutation') {
      // A mutation is always limited to just a single result and is never shared
      return pipe(
        operationResults$,
        onStart<OperationResult>(() => this.dispatchOperation(operation)),
        take(1)
      );
    }

    const teardown$ = pipe(
      this.operations$,
      filter(op => op.operationName === 'teardown' && op.key === key)
    );

    const result$ = pipe(
      operationResults$,
      takeUntil(teardown$),
      onStart<OperationResult>(() => this.onOperationStart(operation)),
      onEnd<OperationResult>(() => this.onOperationEnd(operation))
    );

    return this.suspense && operationName !== 'subscription'
      ? toSuspenseSource(result$)
      : result$;
  }

  reexecuteOperation = (operation: Operation) => {
    // Reexecute operation only if any subscribers are still subscribed to the
    // operation's exchange results
    if ((this.activeOperations[operation.key] || 0) > 0) {
      this.dispatchOperation(operation);
    }
  };

  query(
    query: DocumentNode | string,
    variables?: object,
    context?: Partial<OperationContext>
  ): PromisifiedSource<OperationResult> {
    return withPromise<OperationResult>(
      this.executeQuery(createRequest(query, variables), context)
    );
  }

  executeQuery = (
    query: GraphQLRequest,
    opts?: Partial<OperationContext>
  ): Source<OperationResult> => {
    const operation = this.createRequestOperation('query', query, opts);
    const response$ = this.executeRequestOperation(operation);
    const { pollInterval } = operation.context;

    if (pollInterval) {
      return pipe(
        merge([fromValue(0), interval(pollInterval)]),
        switchMap(() => response$)
      );
    }

    return response$;
  };

  executeSubscription = (
    query: GraphQLRequest,
    opts?: Partial<OperationContext>
  ): Source<OperationResult> => {
    const operation = this.createRequestOperation('subscription', query, opts);
    return this.executeRequestOperation(operation);
  };

  mutation(
    query: DocumentNode | string,
    variables?: object,
    context?: Partial<OperationContext>
  ): PromisifiedSource<OperationResult> {
    return withPromise<OperationResult>(
      this.executeMutation(createRequest(query, variables), context)
    );
  }

  executeMutation = (
    query: GraphQLRequest,
    opts?: Partial<OperationContext>
  ): Source<OperationResult> => {
    const operation = this.createRequestOperation('mutation', query, opts);
    return this.executeRequestOperation(operation);
  };
}

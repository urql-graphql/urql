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
  publish,
  subscribe,
  map,
  Subscription,
} from 'wonka';

import { composeExchanges, defaultExchanges } from './exchanges';
import { fallbackExchange } from './exchanges/fallback';

import {
  Exchange,
  ExchangeInput,
  GraphQLRequest,
  Operation,
  OperationContext,
  OperationResult,
  OperationType,
  RequestPolicy,
  PromisifiedSource,
  DebugEvent,
} from './types';

import {
  createRequest,
  toSuspenseSource,
  withPromise,
  maskTypename,
  noop,
} from './utils';

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
  /** Use HTTP GET for queries. */
  preferGetMethod?: boolean;
  /** Mask __typename from results. */
  maskTypename?: boolean;
}

interface ActiveOperations {
  [operationKey: string]: number;
}

export const createClient = (opts: ClientOptions) => new Client(opts);

/** The URQL application-wide client library. Each execute method starts a GraphQL request and returns a stream of results. */
export class Client {
  /** Start an operation from an exchange */
  reexecuteOperation: (operation: Operation) => void;

  // Event target for monitoring
  subscribeToDebugTarget?: (onEvent: (e: DebugEvent) => void) => Subscription;

  // These are variables derived from ClientOptions
  url: string;
  fetch?: typeof fetch;
  fetchOptions?: RequestInit | (() => RequestInit);
  suspense: boolean;
  preferGetMethod: boolean;
  requestPolicy: RequestPolicy;
  maskTypename: boolean;

  // These are internals to be used to keep track of operations
  dispatchOperation: (operation?: Operation | void) => void;
  operations$: Source<Operation>;
  results$: Source<OperationResult>;
  activeOperations = Object.create(null) as ActiveOperations;
  queue: Operation[] = [];

  constructor(opts: ClientOptions) {
    if (process.env.NODE_ENV !== 'production' && !opts.url) {
      throw new Error('You are creating an urql-client without a url.');
    }

    let dispatchDebug: ExchangeInput['dispatchDebug'] = noop;
    if (process.env.NODE_ENV !== 'production') {
      const { next, source } = makeSubject<DebugEvent>();
      this.subscribeToDebugTarget = (onEvent: (e: DebugEvent) => void) =>
        pipe(source, subscribe(onEvent));
      dispatchDebug = next as ExchangeInput['dispatchDebug'];
    }

    this.url = opts.url;
    this.fetchOptions = opts.fetchOptions;
    this.fetch = opts.fetch;
    this.suspense = !!opts.suspense;
    this.requestPolicy = opts.requestPolicy || 'cache-first';
    this.preferGetMethod = !!opts.preferGetMethod;
    this.maskTypename = !!opts.maskTypename;

    // This subject forms the input of operations; executeOperation may be
    // called to dispatch a new operation on the subject
    const { source: operations$, next: nextOperation } = makeSubject<
      Operation
    >();
    this.operations$ = operations$;

    let isOperationBatchActive = false;
    this.dispatchOperation = (operation?: Operation | void) => {
      isOperationBatchActive = true;
      if (operation) nextOperation(operation);
      while ((operation = this.queue.shift())) nextOperation(operation);
      isOperationBatchActive = false;
    };

    this.reexecuteOperation = (operation: Operation) => {
      // Reexecute operation only if any subscribers are still subscribed to the
      // operation's exchange results
      if ((this.activeOperations[operation.key] || 0) > 0) {
        this.queue.push(operation);
        if (!isOperationBatchActive) {
          Promise.resolve().then(this.dispatchOperation);
        }
      }
    };

    const exchanges =
      opts.exchanges !== undefined ? opts.exchanges : defaultExchanges;

    // All exchange are composed into a single one and are called using the constructed client
    // and the fallback exchange stream
    const composedExchange = composeExchanges(exchanges);

    // All exchanges receive inputs using which they can forward operations to the next exchange
    // and receive a stream of results in return, access the client, or dispatch debugging events
    // All operations then run through the Exchange IOs in a pipeline-like fashion
    this.results$ = share(
      composedExchange({
        client: this,
        dispatchDebug,
        forward: fallbackExchange({ dispatchDebug }),
      })(this.operations$)
    );

    // Prevent the `results$` exchange pipeline from being closed by active
    // cancellations cascading up from components
    pipe(this.results$, publish);
  }

  private createOperationContext = (
    opts?: Partial<OperationContext>
  ): OperationContext => ({
    url: this.url,
    fetchOptions: this.fetchOptions,
    fetch: this.fetch,
    preferGetMethod: this.preferGetMethod,
    ...opts,
    requestPolicy: (opts || {}).requestPolicy || this.requestPolicy,
  });

  createRequestOperation = (
    type: OperationType,
    request: GraphQLRequest,
    opts?: Partial<OperationContext>
  ): Operation => ({
    key: request.key,
    query: request.query,
    variables: request.variables,
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
    let operationResults$ = pipe(
      this.results$,
      filter((res: OperationResult) => res.operation.key === key)
    );

    if (this.maskTypename) {
      operationResults$ = pipe(
        operationResults$,
        map(res => {
          res.data = maskTypename(res.data);
          return res;
        })
      );
    }

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
      filter(
        (op: Operation) => op.operationName === 'teardown' && op.key === key
      )
    );

    const result$ = pipe(
      operationResults$,
      takeUntil(teardown$),
      onStart<OperationResult>(() => {
        this.onOperationStart(operation);
      }),
      onEnd<OperationResult>(() => {
        this.onOperationEnd(operation);
      })
    );

    return operation.context.suspense !== false &&
      this.suspense &&
      operationName === 'query'
      ? toSuspenseSource<OperationResult>(result$ as Source<OperationResult>)
      : (result$ as Source<OperationResult>);
  }

  query<Data = any, Variables extends object = {}>(
    query: DocumentNode | string,
    variables?: Variables,
    context?: Partial<OperationContext>
  ): PromisifiedSource<OperationResult<Data>> {
    if (!context || typeof context.suspense !== 'boolean') {
      context = { ...context, suspense: false };
    }

    return withPromise<OperationResult<Data>>(
      this.executeQuery(createRequest(query, variables), context)
    );
  }

  readQuery<Data = any, Variables extends object = {}>(
    query: DocumentNode | string,
    variables?: Variables,
    context?: Partial<OperationContext>
  ): OperationResult<Data> | null {
    let result: OperationResult<Data> | null = null;

    pipe(
      this.executeQuery(createRequest(query, variables), context),
      subscribe(res => {
        result = res;
      })
    ).unsubscribe();

    return result;
  }

  executeQuery = <Data = any>(
    query: GraphQLRequest,
    opts?: Partial<OperationContext>
  ): Source<OperationResult<Data>> => {
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

  subscription<Data = any, Variables extends object = {}>(
    query: DocumentNode | string,
    variables?: Variables,
    context?: Partial<OperationContext>
  ): Source<OperationResult<Data>> {
    return this.executeSubscription(createRequest(query, variables), context);
  }

  executeSubscription = (
    query: GraphQLRequest,
    opts?: Partial<OperationContext>
  ): Source<OperationResult> => {
    const operation = this.createRequestOperation('subscription', query, opts);
    return this.executeRequestOperation(operation);
  };

  mutation<Data = any, Variables extends object = {}>(
    query: DocumentNode | string,
    variables?: Variables,
    context?: Partial<OperationContext>
  ): PromisifiedSource<OperationResult<Data>> {
    return withPromise<OperationResult<Data>>(
      this.executeMutation(createRequest(query, variables), context)
    );
  }

  executeMutation = <Data = any>(
    query: GraphQLRequest,
    opts?: Partial<OperationContext>
  ): Source<OperationResult<Data>> => {
    const operation = this.createRequestOperation('mutation', query, opts);
    return this.executeRequestOperation(operation);
  };
}

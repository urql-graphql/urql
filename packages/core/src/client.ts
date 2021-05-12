/* eslint-disable @typescript-eslint/no-use-before-define */

import {
  filter,
  make,
  makeSubject,
  onEnd,
  onPush,
  onStart,
  pipe,
  share,
  Source,
  take,
  takeUntil,
  publish,
  subscribe,
  switchMap,
  fromValue,
  merge,
  map,
  Subscription,
} from 'wonka';

import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { DocumentNode } from 'graphql';

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
  withPromise,
  maskTypename,
  noop,
  makeOperation,
} from './utils';

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
  activeOperations: Map<number, Source<OperationResult>> = new Map();
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
    const {
      source: operations$,
      next: nextOperation,
    } = makeSubject<Operation>();
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
      if (
        operation.kind === 'mutation' ||
        this.activeOperations.has(operation.key)
      ) {
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

  createOperationContext = (
    opts?: Partial<OperationContext>
  ): OperationContext => {
    if (!opts) opts = {};

    return {
      url: this.url,
      fetchOptions: this.fetchOptions,
      fetch: this.fetch,
      preferGetMethod: this.preferGetMethod,
      ...opts,
      suspense: opts.suspense || (opts.suspense !== false && this.suspense),
      requestPolicy: opts.requestPolicy || this.requestPolicy,
    };
  };

  createRequestOperation = <Data = any, Variables = object>(
    kind: OperationType,
    request: GraphQLRequest<Data, Variables>,
    opts?: Partial<OperationContext>
  ): Operation<Data, Variables> =>
    makeOperation<Data, Variables>(
      kind,
      request,
      this.createOperationContext(opts)
    );

  /** Executes an Operation by sending it through the exchange pipeline It returns an observable that emits all related exchange results and keeps track of this observable's subscribers. A teardown signal will be emitted when no subscribers are listening anymore. */
  executeRequestOperation: <Data = any, Variables = object>(
    operation: Operation<Data, Variables>
  ) => Source<OperationResult<Data, Variables>> = makeExecutor(this);

  query<Data = any, Variables extends object = {}>(
    query: DocumentNode | TypedDocumentNode<Data, Variables> | string,
    variables?: Variables,
    context?: Partial<OperationContext>
  ): PromisifiedSource<OperationResult<Data, Variables>> {
    if (!context || typeof context.suspense !== 'boolean') {
      context = { ...context, suspense: false };
    }

    return withPromise<OperationResult<Data, Variables>>(
      this.executeQuery<Data, Variables>(
        createRequest(query, variables),
        context
      )
    );
  }

  readQuery<Data = any, Variables extends object = {}>(
    query: DocumentNode | TypedDocumentNode<Data, Variables> | string,
    variables?: Variables,
    context?: Partial<OperationContext>
  ): OperationResult<Data, Variables> | null {
    let result: OperationResult<Data, Variables> | null = null;

    pipe(
      this.query(query, variables, context),
      subscribe(res => {
        result = res;
      })
    ).unsubscribe();

    return result;
  }

  executeQuery = <Data = any, Variables = object>(
    query: GraphQLRequest<Data, Variables>,
    opts?: Partial<OperationContext>
  ): Source<OperationResult<Data, Variables>> => {
    const operation = this.createRequestOperation('query', query, opts);
    return this.executeRequestOperation<Data, Variables>(operation);
  };

  subscription<Data = any, Variables extends object = {}>(
    query: DocumentNode | TypedDocumentNode<Data, Variables> | string,
    variables?: Variables,
    context?: Partial<OperationContext>
  ): Source<OperationResult<Data, Variables>> {
    return this.executeSubscription<Data, Variables>(
      createRequest(query, variables),
      context
    );
  }

  executeSubscription = <Data = any, Variables = object>(
    query: GraphQLRequest<Data, Variables>,
    opts?: Partial<OperationContext>
  ): Source<OperationResult<Data, Variables>> => {
    const operation = this.createRequestOperation('subscription', query, opts);
    return this.executeRequestOperation<Data, Variables>(operation);
  };

  mutation<Data = any, Variables extends object = {}>(
    query: DocumentNode | TypedDocumentNode<Data, Variables> | string,
    variables?: Variables,
    context?: Partial<OperationContext>
  ): PromisifiedSource<OperationResult<Data, Variables>> {
    return withPromise<OperationResult<Data, Variables>>(
      this.executeMutation<Data, Variables>(
        createRequest(query, variables),
        context
      )
    );
  }

  executeMutation = <Data = any, Variables = object>(
    query: GraphQLRequest<Data, Variables>,
    opts?: Partial<OperationContext>
  ): Source<OperationResult<Data, Variables>> => {
    const operation = this.createRequestOperation('mutation', query, opts);
    return this.executeRequestOperation<Data, Variables>(operation);
  };
}

function makeExecutor(
  client: Client
): (operation: Operation) => Source<OperationResult> {
  const replays = new Map<number, OperationResult>();

  const makeResultSource = (operation: Operation) => {
    let result$ = pipe(
      client.results$,
      filter(
        (res: OperationResult) =>
          res.operation.kind === operation.kind &&
          res.operation.key === operation.key
      )
    );

    // Mask typename properties if the option for it is turned on
    if (client.maskTypename) {
      result$ = pipe(
        result$,
        map(res => ({ ...res, data: maskTypename(res.data) }))
      );
    }

    // A mutation is always limited to just a single result and is never shared
    if (operation.kind === 'mutation') {
      return pipe(
        result$,
        onStart(() => client.dispatchOperation(operation)),
        take(1)
      );
    }

    const source = pipe(
      result$,
      // End the results stream when an active teardown event is sent
      takeUntil(
        pipe(
          client.operations$,
          filter(op => op.kind === 'teardown' && op.key === operation.key)
        )
      ),
      switchMap(result => {
        if (result.stale) {
          return fromValue(result);
        }

        return merge([
          fromValue(result),
          // Mark a result as stale when a new operation is sent for it
          pipe(
            client.operations$,
            filter(op => {
              return (
                op.kind === operation.kind &&
                op.key === operation.key &&
                (op.context.requestPolicy === 'network-only' ||
                  op.context.requestPolicy === 'cache-and-network')
              );
            }),
            take(1),
            map(() => ({ ...result, stale: true }))
          ),
        ]);
      }),
      onPush(result => {
        replays.set(operation.key, result);
      }),
      onStart(() => {
        client.activeOperations.set(operation.key, source);
      }),
      onEnd(() => {
        // Delete the active operation handle
        replays.delete(operation.key);
        client.activeOperations.delete(operation.key);
        // Delete all queued up operations of the same key on end
        for (let i = client.queue.length - 1; i >= 0; i--)
          if (client.queue[i].key === operation.key) client.queue.splice(i, 1);
        // Dispatch a teardown signal for the stopped operation
        client.dispatchOperation(
          makeOperation('teardown', operation, operation.context)
        );
      }),
      share
    );

    return source;
  };

  return operation => {
    if (operation.kind === 'mutation') {
      return makeResultSource(operation);
    }

    const source =
      client.activeOperations.get(operation.key) || makeResultSource(operation);

    const isNetworkOperation =
      operation.context.requestPolicy === 'cache-and-network' ||
      operation.context.requestPolicy === 'network-only';

    return make(observer => {
      return pipe(
        source,
        onStart(() => {
          const prevReplay = replays.get(operation.key);

          if (operation.kind === 'subscription') {
            return client.dispatchOperation(operation);
          } else if (isNetworkOperation) {
            client.dispatchOperation(operation);
          }

          if (prevReplay != null && prevReplay === replays.get(operation.key)) {
            observer.next(
              isNetworkOperation ? { ...prevReplay, stale: true } : prevReplay
            );
          } else if (!isNetworkOperation) {
            client.dispatchOperation(operation);
          }
        }),
        onEnd(observer.complete),
        subscribe(observer.next)
      ).unsubscribe;
    });
  };
}

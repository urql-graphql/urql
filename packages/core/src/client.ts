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
  getOperationType,
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

export interface Client {
  new (options: ClientOptions): Client;

  operations$: Source<Operation>;

  /** Start an operation from an exchange */
  reexecuteOperation: (operation: Operation) => void;
  /** Event target for monitoring, e.g. for @urql/devtools */
  subscribeToDebugTarget?: (onEvent: (e: DebugEvent) => void) => Subscription;

  // These are variables derived from ClientOptions
  url: string;
  fetch?: typeof fetch;
  fetchOptions?: RequestInit | (() => RequestInit);
  suspense: boolean;
  requestPolicy: RequestPolicy;
  preferGetMethod: boolean;
  maskTypename: boolean;

  createOperationContext(
    opts?: Partial<OperationContext> | undefined
  ): OperationContext;

  createRequestOperation<Data = any, Variables = object>(
    kind: OperationType,
    request: GraphQLRequest<Data, Variables>,
    opts?: Partial<OperationContext> | undefined
  ): Operation<Data, Variables>;

  /** Executes an Operation by sending it through the exchange pipeline It returns an observable that emits all related exchange results and keeps track of this observable's subscribers. A teardown signal will be emitted when no subscribers are listening anymore. */
  executeRequestOperation<Data = any, Variables = object>(
    operation: Operation<Data, Variables>
  ): Source<OperationResult<Data, Variables>>;

  query<Data = any, Variables extends object = {}>(
    query: DocumentNode | TypedDocumentNode<Data, Variables> | string,
    variables?: Variables,
    context?: Partial<OperationContext>
  ): PromisifiedSource<OperationResult<Data, Variables>>;

  readQuery<Data = any, Variables extends object = {}>(
    query: DocumentNode | TypedDocumentNode<Data, Variables> | string,
    variables?: Variables,
    context?: Partial<OperationContext>
  ): OperationResult<Data, Variables> | null;

  executeQuery<Data = any, Variables = object>(
    query: GraphQLRequest<Data, Variables>,
    opts?: Partial<OperationContext> | undefined
  ): Source<OperationResult<Data, Variables>>;

  subscription<Data = any, Variables extends object = {}>(
    query: DocumentNode | TypedDocumentNode<Data, Variables> | string,
    variables?: Variables,
    context?: Partial<OperationContext>
  ): Source<OperationResult<Data, Variables>>;

  executeSubscription<Data = any, Variables = object>(
    query: GraphQLRequest<Data, Variables>,
    opts?: Partial<OperationContext> | undefined
  ): Source<OperationResult<Data, Variables>>;

  mutation<Data = any, Variables extends object = {}>(
    query: DocumentNode | TypedDocumentNode<Data, Variables> | string,
    variables?: Variables,
    context?: Partial<OperationContext>
  ): PromisifiedSource<OperationResult<Data, Variables>>;

  executeMutation<Data = any, Variables = object>(
    query: GraphQLRequest<Data, Variables>,
    opts?: Partial<OperationContext> | undefined
  ): Source<OperationResult<Data, Variables>>;
}

export const Client: new (opts: ClientOptions) => Client = function Client(
  this: Client | {},
  opts: ClientOptions
) {
  if (process.env.NODE_ENV !== 'production' && !opts.url) {
    throw new Error('You are creating an urql-client without a url.');
  }

  const replays = new Map<number, OperationResult>();
  const active: Map<number, Source<OperationResult>> = new Map();
  const queue: Operation[] = [];

  // This subject forms the input of operations; executeOperation may be
  // called to dispatch a new operation on the subject
  const { source: operations$, next: nextOperation } = makeSubject<Operation>();

  // We define a queued dispatcher on the subject, which empties the queue when it's
  // activated to allow `reexecuteOperation` to be trampoline-scheduled
  let isOperationBatchActive = false;
  function dispatchOperation(operation?: Operation | void) {
    isOperationBatchActive = true;
    if (operation) nextOperation(operation);
    while ((operation = queue.shift())) nextOperation(operation);
    isOperationBatchActive = false;
  }

  /** Defines how result streams are created */
  const makeResultSource = (operation: Operation) => {
    let result$ = pipe(
      results$,
      filter((res: OperationResult) => {
        return (
          res.operation.kind === operation.kind &&
          res.operation.key === operation.key &&
          (!res.operation.context._instance ||
            res.operation.context._instance === operation.context._instance)
        );
      })
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
        onStart(() => dispatchOperation(operation)),
        take(1)
      );
    }

    const source = pipe(
      result$,
      // End the results stream when an active teardown event is sent
      takeUntil(
        pipe(
          operations$,
          filter(op => op.kind === 'teardown' && op.key === operation.key)
        )
      ),
      switchMap(result => {
        if (operation.kind !== 'query' || result.stale) {
          return fromValue(result);
        }

        return merge([
          fromValue(result),
          // Mark a result as stale when a new operation is sent for it
          pipe(
            operations$,
            filter(
              op =>
                op.kind === 'query' &&
                op.key === operation.key &&
                op.context.requestPolicy !== 'cache-only'
            ),
            take(1),
            map(() => ({ ...result, stale: true }))
          ),
        ]);
      }),
      onPush(result => {
        replays.set(operation.key, result);
      }),
      onEnd(() => {
        // Delete the active operation handle
        replays.delete(operation.key);
        active.delete(operation.key);
        // Delete all queued up operations of the same key on end
        for (let i = queue.length - 1; i >= 0; i--)
          if (queue[i].key === operation.key) queue.splice(i, 1);
        // Dispatch a teardown signal for the stopped operation
        dispatchOperation(
          makeOperation('teardown', operation, operation.context)
        );
      }),
      share
    );

    return source;
  };

  const instance: Client =
    this instanceof Client ? this : Object.create(Client.prototype);
  const client: Client = Object.assign(instance, {
    url: opts.url,
    fetchOptions: opts.fetchOptions,
    fetch: opts.fetch,
    suspense: !!opts.suspense,
    requestPolicy: opts.requestPolicy || 'cache-first',
    preferGetMethod: !!opts.preferGetMethod,
    maskTypename: !!opts.maskTypename,

    operations$,

    reexecuteOperation(operation: Operation) {
      // Reexecute operation only if any subscribers are still subscribed to the
      // operation's exchange results
      if (operation.kind === 'mutation' || active.has(operation.key)) {
        queue.push(operation);
        if (!isOperationBatchActive) {
          Promise.resolve().then(dispatchOperation);
        }
      }
    },

    createOperationContext(opts) {
      if (!opts) opts = {};

      return {
        _instance: undefined,
        url: client.url,
        fetchOptions: client.fetchOptions,
        fetch: client.fetch,
        preferGetMethod: client.preferGetMethod,
        ...opts,
        suspense: opts.suspense || (opts.suspense !== false && client.suspense),
        requestPolicy: opts.requestPolicy || client.requestPolicy,
      };
    },

    createRequestOperation(kind, request, opts) {
      const requestOperationType = getOperationType(request.query);
      if (
        process.env.NODE_ENV !== 'production' &&
        kind !== 'teardown' &&
        requestOperationType !== kind
      ) {
        throw new Error(
          `Expected operation of type "${kind}" but found "${requestOperationType}"`
        );
      }
      const context = client.createOperationContext(opts);
      if (kind === 'mutation') (context as any)._instance = [];
      return makeOperation(kind, request, context);
    },

    executeRequestOperation(operation) {
      if (operation.kind === 'mutation') {
        return makeResultSource(operation);
      }

      return make(observer => {
        let source = active.get(operation.key);

        if (!source) {
          active.set(operation.key, (source = makeResultSource(operation)));
        }

        const isNetworkOperation =
          operation.context.requestPolicy === 'cache-and-network' ||
          operation.context.requestPolicy === 'network-only';

        return pipe(
          source,
          onStart(() => {
            const prevReplay = replays.get(operation.key);

            if (operation.kind === 'subscription') {
              return dispatchOperation(operation);
            } else if (isNetworkOperation) {
              dispatchOperation(operation);
            }

            if (
              prevReplay != null &&
              prevReplay === replays.get(operation.key)
            ) {
              observer.next(
                isNetworkOperation ? { ...prevReplay, stale: true } : prevReplay
              );
            } else if (!isNetworkOperation) {
              dispatchOperation(operation);
            }
          }),
          onEnd(observer.complete),
          subscribe(observer.next)
        ).unsubscribe;
      });
    },

    executeQuery(query, opts) {
      const operation = client.createRequestOperation('query', query, opts);
      return client.executeRequestOperation(operation);
    },

    executeSubscription(query, opts) {
      const operation = client.createRequestOperation(
        'subscription',
        query,
        opts
      );
      return client.executeRequestOperation(operation);
    },

    executeMutation(query, opts) {
      const operation = client.createRequestOperation('mutation', query, opts);
      return client.executeRequestOperation(operation);
    },

    query(query, variables, context) {
      if (!context || typeof context.suspense !== 'boolean') {
        context = { ...context, suspense: false };
      }

      return withPromise(
        client.executeQuery(createRequest(query, variables), context)
      );
    },

    readQuery(query, variables, context) {
      let result: OperationResult | null = null;

      pipe(
        client.query(query, variables, context),
        subscribe(res => {
          result = res;
        })
      ).unsubscribe();

      return result;
    },

    subscription(query, variables, context) {
      return client.executeSubscription(
        createRequest(query, variables),
        context
      );
    },

    mutation(query, variables, context) {
      return withPromise(
        client.executeMutation(createRequest(query, variables), context)
      );
    },
  } as Client);

  let dispatchDebug: ExchangeInput['dispatchDebug'] = noop;
  if (process.env.NODE_ENV !== 'production') {
    const { next, source } = makeSubject<DebugEvent>();
    client.subscribeToDebugTarget = (onEvent: (e: DebugEvent) => void) =>
      pipe(source, subscribe(onEvent));
    dispatchDebug = next as ExchangeInput['dispatchDebug'];
  }

  const exchanges =
    opts.exchanges !== undefined ? opts.exchanges : defaultExchanges;

  // All exchange are composed into a single one and are called using the constructed client
  // and the fallback exchange stream
  const composedExchange = composeExchanges(exchanges);

  // All exchanges receive inputs using which they can forward operations to the next exchange
  // and receive a stream of results in return, access the client, or dispatch debugging events
  // All operations then run through the Exchange IOs in a pipeline-like fashion
  const results$ = share(
    composedExchange({
      client,
      dispatchDebug,
      forward: fallbackExchange({ dispatchDebug }),
    })(operations$)
  );

  // Prevent the `results$` exchange pipeline from being closed by active
  // cancellations cascading up from components
  pipe(results$, publish);

  return client;
} as any;

export const createClient = (Client as any) as (opts: ClientOptions) => Client;

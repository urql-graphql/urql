/* eslint-disable @typescript-eslint/no-use-before-define */

import {
  lazy,
  filter,
  makeSubject,
  onEnd,
  onPush,
  onStart,
  pipe,
  share,
  Source,
  take,
  takeUntil,
  takeWhile,
  publish,
  subscribe,
  switchMap,
  fromValue,
  merge,
  map,
  Subscription,
} from 'wonka';

import { composeExchanges } from './exchanges';
import { fallbackExchange } from './exchanges/fallback';

import {
  DocumentInput,
  AnyVariables,
  Exchange,
  ExchangeInput,
  GraphQLRequest,
  Operation,
  OperationInstance,
  OperationContext,
  OperationResult,
  OperationResultSource,
  OperationType,
  RequestPolicy,
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

/** Configuration options passed when creating a new {@link Client}.
 *
 * @remarks
 * The `ClientOptions` are passed when creating a new {@link Client}, and
 * are used to instantiate the pipeline of {@link Exchange | Exchanges}, configure
 * options used to initialize {@link OperationContext | OperationContexts}, or to
 * change the general behaviour of the {@link Client}.
 */
export interface ClientOptions {
  /** Target URL used by fetch exchanges to make GraphQL API requests to.
   *
   * @remarks
   * This is the URL that fetch exchanges will call to make GraphQL API requests.
   * This value is copied to {@link OperationContext.url}.
   */
  url: string;
  /** Additional options used by fetch exchanges that'll be passed to the `fetch` call on API requests.
   *
   * @remarks
   * The options in this object or an object returned by a callback function will be merged into the
   * {@link RequestInit} options passed to the `fetch` call.
   *
   * Hint: If you're trying to implement more complex changes per {@link Operation}, it's worth considering
   * to use the {@link mapExchange} instead, which allows you to change `Operation`s and `OperationResult`s.
   *
   * Hint: If you're trying to use this as a function for authentication, consider checking out
   * `@urql/exchange-auth` instead, which allows you to handle refresh auth flows, and more
   * complex auth flows.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/fetch} for a description of this object.
   */
  fetchOptions?: RequestInit | (() => RequestInit);
  /** A `fetch` function polyfill used by fetch exchanges to make API calls.
   *
   * @remarks
   * This is the fetch polyfill used by any fetch exchange to make an API request. By default, when this
   * option isn't set, any fetch exchange will attempt to use the globally available `fetch` function
   * to make a request instead.
   *
   * It's recommended to only pass a polyfill, if any of the environments you're running the {@link Client}
   * in don't support the Fetch API natively.
   *
   * Hint: If you're using the "Incremental Delivery" multipart spec, for instance with `@defer` directives,
   * you're better off using the native `fetch` function, or must ensure that your polyfill supports streamed
   * results. However, a "Streaming requests unsupported" error will be thrown, to let you know that your `fetch`
   * API doesn't support incrementally streamed responses, if this mode is used.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API} for the Fetch API spec.
   */
  fetch?: typeof fetch;
  /** Allows a subscription to be executed using a `fetch` API request.
   *
   * @remarks
   * If your API supports the `text/event-stream` and/or `multipart/mixed` response protocol, and you use
   * this protocol to handle subscriptions, then you may switch this flag to `true`.
   *
   * This means you won’t have to create a {@link subscriptionExchange} to handle subscriptions with an
   * external transport, and will instead be able to use GraphQL over HTTP transports.
   */
  fetchSubscriptions?: boolean;
  /** A list of `Exchange`s that will be used to create the `Client`'s execution pipeline.
   *
   * @remarks
   * The {@link Client} accepts and composes a list of {@link Exchange | Exchanges} into an “exchange pipeline”
   * which receive a stream of {@link Operation | Operations} the `Client` wishes to execute, and return a stream
   * of {@link OperationResult | OperationResults}.
   *
   * This is the basis for how `urql` handles GraphQL operations, and exchanges handle the creation, execution,
   * and control flow of exchanges for the `Client`.
   *
   * To easily get started you should consider using the {@link dedupExchange}, {@link cacheExchange} and {@link fetchExchange}
   * these are all exported from the core package.
   *
   * @see {@link https://urql.dev/goto/docs/architecture/#the-client-and-exchanges} for more information
   * on what `Exchange`s are and how they work.
   */
  exchanges: Exchange[];
  /** A configuration flag indicating whether support for "Suspense" is activated.
   *
   * @remarks
   * This configuration flag is only relevant for using `urql` with the React or Preact bindings.
   * When activated it allows `useQuery` to "suspend" instead of returning a loading state, which
   * will stop updates in a querying component and instead cascade
   * to a higher suspense boundary for a loading state.
   *
   * Hint: While, when this option is enabled, by default all `useQuery` hooks will suspense, you can
   * disable Suspense selectively for each hook.
   *
   * @see {@link https://beta.reactjs.org/blog/2022/03/29/react-v18#new-suspense-features} for more information on React Suspense.
   */
  suspense?: boolean;
  /** The request and caching strategy that all `Operation`s on this `Client` will use by default.
   *
   * @remarks
   * The {@link RequestPolicy} instructs cache exchanges how to use and treat their cached results.
   * By default `cache-first` is set and used, which will use cache results, and only make an API request
   * on a cache miss.
   *
   * The `requestPolicy` can be overriden per operation, since it's added to the {@link OperationContext},
   * which allows you to change the policy per `Operation`, rather than changing it by default here.
   *
   * Hint: We don’t recommend changing this from the default `cache-first` option, unless you know what
   * you‘re doing. Setting this to `cache-and-network` is not recommend and may not lead to the behaviour
   * you expect. If you’re looking to always update your cache frequently, use `@urql/exchange-request-policy`
   * instead.
   */
  requestPolicy?: RequestPolicy;
  /** Instructs fetch exchanges to use a GET request.
   *
   * @remarks
   * This changes the {@link OperationContext.preferGetMethod} option, which tells fetch exchanges
   * to use GET requests for queries instead of POST requests.
   *
   * When set to `true` or `'within-url-limit'`, built-in fetch exchanges will always attempt to send query
   * operations as GET requests, unless the resulting URL exceeds a length of 2,048 characters.
   * If you want to bypass this restriction, set this option to `'force'` instead, to always send GET.
   * requests for queries.
   */
  preferGetMethod?: boolean | 'force' | 'within-url-limit';
  /** Instructs the `Client` to remove `__typename` properties on all results.
   *
   * @remarks
   * By default, cache exchanges will alter your GraphQL documents to request `__typename` fields
   * for all selections. However, this means that your GraphQL data will now contain `__typename` fields you
   * didn't ask for. This is why the {@link Client} supports “masking” this field by marking it
   * as non-enumerable via this option.
   *
   * Only use this option if you absolutely have to. It's popular to model mutation inputs in
   * GraphQL schemas after the object types they modify, and if you're using this option to make
   * it possible to directly pass objects from results as inputs to your mutation variables, it's
   * more performant and idomatic to instead create a new input object.
   *
   * Hint: With `@urql/exchange-graphcache` you will never need this option, as it selects fields on
   * the client-side according to which fields you specified, rather than the fields it modified.
   *
   * @see {@link https://spec.graphql.org/October2021/#sec-Type-Name-Introspection} for more information
   * on typename introspection via the `__typename` field.
   */
  maskTypename?: boolean;
}

/** The `Client` is the central hub for your GraphQL operations and holds `urql`'s state.
 *
 * @remarks
 * The `Client` manages your active GraphQL operations and their state, and contains the
 * {@link Exchange} pipeline to execute your GraphQL operations.
 *
 * It contains methods that allow you to execute GraphQL operations manually, but the `Client`
 * is also interacted with by bindings (for React, Preact, Vue, Svelte, etc) to execute GraphQL
 * operations.
 *
 * While {@link Exchange | Exchanges} are ultimately responsible for the control flow of operations,
 * sending API requests, and caching, the `Client` still has the important responsibility for
 * creating operations, managing consumers of active operations, sharing results for operations,
 * and more tasks as a “central hub”.
 *
 * @see {@link https://urql.dev/goto/docs/architecture/#requests-and-operations-on-the-client} for more information
 * on what the `Client` is and does.
 */
export interface Client {
  new (options: ClientOptions): Client;

  /** Exposes the stream of `Operation`s that is passed to the `Exchange` pipeline.
   *
   * @remarks
   * This is a Wonka {@link Source} that issues the {@link Operation | Operations} going into
   * the exchange pipeline.
   * @internal
   */
  operations$: Source<Operation>;

  /** Flag indicating whether support for “Suspense” is activated.
   *
   * @remarks
   * This flag indicates whether support for “Suspense” has been activated via the
   * {@link ClientOptions.suspense} flag.
   *
   * When this is enabled, the {@link Client} itself doesn’t function any differently, and the flag
   * only serves as an instructions for the React/Preact bindings to change their behaviour.
   *
   * @see {@link ClientOptions.suspense} for more information.
   * @internal
   */
  suspense: boolean;

  /** Dispatches an `Operation` to the `Exchange` pipeline, if this `Operation` is active.
   *
   * @remarks
   * This method is frequently used in {@link Exchange | Exchanges}, for instance caches, to reexecute
   * an operation. It’s often either called because an `Operation` will need to be queried against the
   * cache again, if a cache result has changed or been invalidated, or it’s called with an {@link Operation}'s
   * {@link RequestPolicy} set to `network-only` to issue a network request.
   *
   * This method will only dispatch an {@link Operation} if it has active consumers, meaning,
   * active subscribers to the sources of {@link OperationResult}. For instance, if no bindings
   * (e.g. `useQuery`) is subscribed to the `Operation`, then `reexecuteOperation` will do nothing.
   *
   * All operations are put onto a queue and executed after a micro-tick. The queue of operations is
   * emptied eagerly and synchronously, similar to a trampoline scheduler.
   */
  reexecuteOperation(operation: Operation): void;

  /** Subscribe method to add an event listener to debug events.
   *
   * @param onEvent - A callback called with new debug events, each time an `Exchange` issues them.
   * @returns A Wonka {@link Subscription} which is used to optionally terminate the event listener.
   *
   * @remarks
   * This is a method that's only available in development, and allows the `urql-devtools` to receive
   * to debug events that are issued by exchanges, giving the devtools more information about the flow
   * and execution of {@link Operation | Operations}.
   *
   * @see {@link DebugEventTypes} for a description of all debug events.
   * @internal
   */
  subscribeToDebugTarget?(onEvent: (event: DebugEvent) => void): Subscription;

  /** Creates an `Operation` from a `GraphQLRequest` and optionally, overriding `OperationContext` options.
   *
   * @param kind - The {@link OperationType} of GraphQL operation, i.e. `query`, `mutation`, or `subscription`.
   * @param request - A {@link GraphQLRequest} created prior to calling this method.
   * @param opts - {@link OperationContext} options that'll override and be merged with options from the {@link ClientOptions}.
   * @returns An {@link Operation} created from the parameters.
   *
   * @remarks
   * This method is expected to be called with a `kind` set to the `OperationType` of the GraphQL operation.
   * In development, this is enforced by checking that the GraphQL document's operation matches this `kind`.
   *
   * Hint: While bindings will use this method combined with {@link Client.executeRequestOperation}, if
   * you’re executing operations manually, you can use one of the other convenience methods instead.
   *
   * @see {@link Client.executeRequestOperation} for the method used to execute operations.
   * @see {@link createRequest} which creates a `GraphQLRequest` from a `DocumentNode` and variables.
   */
  createRequestOperation<
    Data = any,
    Variables extends AnyVariables = AnyVariables
  >(
    kind: OperationType,
    request: GraphQLRequest<Data, Variables>,
    opts?: Partial<OperationContext> | undefined
  ): Operation<Data, Variables>;

  /** Creates a `Source` that executes the `Operation` and issues `OperationResult`s for this `Operation`.
   *
   * @param operation - {@link Operation} that will be executed.
   * @returns A Wonka {@link Source} of {@link OperationResult | OperationResults} for the passed `Operation`.
   *
   * @remarks
   * The {@link Operation} will be dispatched to the pipeline of {@link Exchange | Exchanges} when
   * subscribing to the returned {@link Source}, which issues {@link OperationResult | OperationResults}
   * belonging to this `Operation`.
   *
   * Internally, {@link OperationResult | OperationResults} are filtered and deliverd to this source by
   * comparing the {@link Operation.key} on the operation and the {@link OperationResult.operation}.
   * For mutations, the {@link OperationContext._instance | `OperationContext._instance`} will additionally be compared, since two mutations
   * with, even given the same variables, will have two distinct results and will be executed separately.
   *
   * The {@link Client} dispatches the {@link Operation} when we subscribe to the returned {@link Source}
   * and will from then on consider the `Operation` as “active” until we unsubscribe. When all consumers unsubscribe
   * from an `Operation` and it becomes “inactive” a `teardown` signal will be dispatched to the
   * {@link Exchange | Exchanges}.
   *
   * Hint: While bindings will use this method, if you’re executing operations manually, you can use one
   * of the other convenience methods instead, like {@link Client.executeQuery} et al.
   */
  executeRequestOperation<
    Data = any,
    Variables extends AnyVariables = AnyVariables
  >(
    operation: Operation<Data, Variables>
  ): OperationResultSource<OperationResult<Data, Variables>>;

  /** Creates a `Source` that executes the GraphQL query operation created from the passed parameters.
   *
   * @param query - a GraphQL document containing the query operation that will be executed.
   * @param variables - the variables used to execute the operation.
   * @param opts - {@link OperationContext} options that'll override and be merged with options from the {@link ClientOptions}.
   * @returns A {@link OperationResultSource} issuing the {@link OperationResult | OperationResults} for the GraphQL operation.
   *
   * @remarks
   * The `Client.query` method is useful to programmatically create and issue a GraphQL query operation.
   * It automatically calls {@link createRequest}, {@link client.createRequestOperation}, and
   * {@link client.executeRequestOperation} for you, and is a convenience method.
   *
   * Since it returns a {@link OperationResultSource} it may be chained with a `toPromise()` call to only
   * await a single result in an async function.
   *
   * Hint: This is the recommended way to create queries programmatically when not using the bindings,
   * or when you’re trying to get a single, promisified result.
   *
   * @example
   * ```ts
   * const getBookQuery = gql`
   *   query GetBook($id: ID!) {
   *     book(id: $id) {
   *       id
   *       name
   *       author {
   *         name
   *       }
   *     }
   *   }
   * `;
   *
   * async function getBook(id) {
   *   const result = await client.query(getBookQuery, { id }).toPromise();
   *   if (result.error) {
   *     throw result.error;
   *   }
   *
   *   return result.data.book;
   * }
   * ```
   */
  query<Data = any, Variables extends AnyVariables = AnyVariables>(
    query: DocumentInput<Data, Variables>,
    variables: Variables,
    context?: Partial<OperationContext>
  ): OperationResultSource<OperationResult<Data, Variables>>;

  /** Returns the first synchronous result a `Client` provides for a given operation.
   *
   * @param query - a GraphQL document containing the query operation that will be executed.
   * @param variables - the variables used to execute the operation.
   * @param opts - {@link OperationContext} options that'll override and be merged with options from the {@link ClientOptions}.
   * @returns An {@link OperationResult} if one became available synchronously or `null`.
   *
   * @remarks
   * The `Client.readQuery` method returns a result synchronously or defaults to `null`. This is useful
   * as it limits the result for a query operation to whatever the cache {@link Exchange} of a {@link Client}
   * had stored and available at that moment.
   *
   * In `urql`, it's expected that cache exchanges return their results synchronously. The bindings
   * and this method exploit this by using synchronous results, like these, to check what data is already
   * in the cache.
   *
   * This method is similar to what all bindings do to synchronously provide the initial state for queries,
   * regardless of whether effects afterwards that subscribe to the query operation update this state synchronously
   * or asynchronously.
   */
  readQuery<Data = any, Variables extends AnyVariables = AnyVariables>(
    query: DocumentInput<Data, Variables>,
    variables: Variables,
    context?: Partial<OperationContext>
  ): OperationResult<Data, Variables> | null;

  /** Creates a `Source` that executes the GraphQL query operation for the passed `GraphQLRequest`.
   *
   * @param query - a {@link GraphQLRequest}
   * @param opts - {@link OperationContext} options that'll override and be merged with options from the {@link ClientOptions}.
   * @returns A {@link PromisifiedSource} issuing the {@link OperationResult | OperationResults} for the GraphQL operation.
   *
   * @remarks
   * The `Client.executeQuery` method is used to programmatically issue a GraphQL query operation.
   * It automatically calls {@link client.createRequestOperation} and {@link client.executeRequestOperation} for you,
   * but requires you to create a {@link GraphQLRequest} using {@link createRequest} yourself first.
   *
   * @see {@link Client.query} for a method that doesn't require calling {@link createRequest} yourself.
   */
  executeQuery<Data = any, Variables extends AnyVariables = AnyVariables>(
    query: GraphQLRequest<Data, Variables>,
    opts?: Partial<OperationContext> | undefined
  ): OperationResultSource<OperationResult<Data, Variables>>;

  /** Creates a `Source` that executes the GraphQL subscription operation created from the passed parameters.
   *
   * @param query - a GraphQL document containing the subscription operation that will be executed.
   * @param variables - the variables used to execute the operation.
   * @param opts - {@link OperationContext} options that'll override and be merged with options from the {@link ClientOptions}.
   * @returns A Wonka {@link Source} issuing the {@link OperationResult | OperationResults} for the GraphQL operation.
   *
   * @remarks
   * The `Client.subscription` method is useful to programmatically create and issue a GraphQL subscription operation.
   * It automatically calls {@link createRequest}, {@link client.createRequestOperation}, and
   * {@link client.executeRequestOperation} for you, and is a convenience method.
   *
   * Hint: This is the recommended way to create subscriptions programmatically when not using the bindings.
   *
   * @example
   * ```ts
   * import { pipe, subscribe } from 'wonka';
   *
   * const getNewsSubscription = gql`
   *   subscription GetNews {
   *     breakingNews {
   *       id
   *       text
   *       createdAt
   *     }
   *   }
   * `;
   *
   * function subscribeToBreakingNews() {
   *   const subscription = pipe(
   *     client.subscription(getNewsSubscription, {}),
   *     subscribe(result => {
   *       if (result.data) {
   *         console.log(result.data.breakingNews.text);
   *       }
   *     })
   *   );
   *
   *   return subscription.unsubscribe;
   * }
   * ```
   */
  subscription<Data = any, Variables extends AnyVariables = AnyVariables>(
    query: DocumentInput<Data, Variables>,
    variables: Variables,
    context?: Partial<OperationContext>
  ): OperationResultSource<OperationResult<Data, Variables>>;

  /** Creates a `Source` that executes the GraphQL subscription operation for the passed `GraphQLRequest`.
   *
   * @param query - a {@link GraphQLRequest}
   * @param opts - {@link OperationContext} options that'll override and be merged with options from the {@link ClientOptions}.
   * @returns A {@link PromisifiedSource} issuing the {@link OperationResult | OperationResults} for the GraphQL operation.
   *
   * @remarks
   * The `Client.executeSubscription` method is used to programmatically issue a GraphQL subscription operation.
   * It automatically calls {@link client.createRequestOperation} and {@link client.executeRequestOperation} for you,
   * but requires you to create a {@link GraphQLRequest} using {@link createRequest} yourself first.
   *
   * @see {@link Client.subscription} for a method that doesn't require calling {@link createRequest} yourself.
   */
  executeSubscription<
    Data = any,
    Variables extends AnyVariables = AnyVariables
  >(
    query: GraphQLRequest<Data, Variables>,
    opts?: Partial<OperationContext> | undefined
  ): OperationResultSource<OperationResult<Data, Variables>>;

  /** Creates a `Source` that executes the GraphQL mutation operation created from the passed parameters.
   *
   * @param query - a GraphQL document containing the mutation operation that will be executed.
   * @param variables - the variables used to execute the operation.
   * @param opts - {@link OperationContext} options that'll override and be merged with options from the {@link ClientOptions}.
   * @returns A {@link PromisifiedSource} issuing the {@link OperationResult | OperationResults} for the GraphQL operation.
   *
   * @remarks
   * The `Client.mutation` method is useful to programmatically create and issue a GraphQL mutation operation.
   * It automatically calls {@link createRequest}, {@link client.createRequestOperation}, and
   * {@link client.executeRequestOperation} for you, and is a convenience method.
   *
   * Since it returns a {@link PromisifiedSource} it may be chained with a `toPromise()` call to only
   * await a single result in an async function. Since mutations will only typically issue one result,
   * using this method is recommended.
   *
   * Hint: This is the recommended way to create mutations programmatically when not using the bindings,
   * or when you’re trying to get a single, promisified result.
   *
   * @example
   * ```ts
   * const createPostMutation = gql`
   *   mutation CreatePost($text: String!) {
   *     createPost(text: $text) {
   *       id
   *       text
   *     }
   *   }
   * `;
   *
   * async function createPost(text) {
   *   const result = await client.mutation(createPostMutation, {
   *     text,
   *   }).toPromise();
   *   if (result.error) {
   *     throw result.error;
   *   }
   *
   *   return result.data.createPost;
   * }
   * ```
   */
  mutation<Data = any, Variables extends AnyVariables = AnyVariables>(
    query: DocumentInput<Data, Variables>,
    variables: Variables,
    context?: Partial<OperationContext>
  ): OperationResultSource<OperationResult<Data, Variables>>;

  /** Creates a `Source` that executes the GraphQL mutation operation for the passed `GraphQLRequest`.
   *
   * @param query - a {@link GraphQLRequest}
   * @param opts - {@link OperationContext} options that'll override and be merged with options from the {@link ClientOptions}.
   * @returns A {@link PromisifiedSource} issuing the {@link OperationResult | OperationResults} for the GraphQL operation.
   *
   * @remarks
   * The `Client.executeMutation` method is used to programmatically issue a GraphQL mutation operation.
   * It automatically calls {@link client.createRequestOperation} and {@link client.executeRequestOperation} for you,
   * but requires you to create a {@link GraphQLRequest} using {@link createRequest} yourself first.
   *
   * @see {@link Client.mutation} for a method that doesn't require calling {@link createRequest} yourself.
   */
  executeMutation<Data = any, Variables extends AnyVariables = AnyVariables>(
    query: GraphQLRequest<Data, Variables>,
    opts?: Partial<OperationContext> | undefined
  ): OperationResultSource<OperationResult<Data, Variables>>;
}

export const Client: new (opts: ClientOptions) => Client = function Client(
  this: Client | {},
  opts: ClientOptions
) {
  if (process.env.NODE_ENV !== 'production' && !opts.url) {
    throw new Error('You are creating an urql-client without a url.');
  }

  let ids = 0;

  const replays = new Map<number, OperationResult>();
  const active: Map<number, Source<OperationResult>> = new Map();
  const dispatched = new Set<number>();
  const queue: Operation[] = [];

  const baseOpts = {
    url: opts.url,
    fetchOptions: opts.fetchOptions,
    fetch: opts.fetch,
    preferGetMethod: !!opts.preferGetMethod,
    requestPolicy: opts.requestPolicy || 'cache-first',
  };

  // This subject forms the input of operations; executeOperation may be
  // called to dispatch a new operation on the subject
  const operations = makeSubject<Operation>();

  function nextOperation(operation: Operation) {
    if (
      operation.kind === 'mutation' ||
      operation.kind === 'teardown' ||
      !dispatched.has(operation.key)
    ) {
      if (operation.kind === 'teardown') {
        dispatched.delete(operation.key);
      } else if (operation.kind !== 'mutation') {
        dispatched.add(operation.key);
      }
      operations.next(operation);
    }
  }

  // We define a queued dispatcher on the subject, which empties the queue when it's
  // activated to allow `reexecuteOperation` to be trampoline-scheduled
  let isOperationBatchActive = false;
  function dispatchOperation(operation?: Operation | void) {
    if (operation) nextOperation(operation);

    if (!isOperationBatchActive) {
      isOperationBatchActive = true;
      while (isOperationBatchActive && (operation = queue.shift()))
        nextOperation(operation);
      isOperationBatchActive = false;
    }
  }

  /** Defines how result streams are created */
  const makeResultSource = (operation: Operation) => {
    let result$ = pipe(
      results$,
      // Filter by matching key (or _instance if it’s set)
      filter(
        (res: OperationResult) =>
          res.operation.kind === operation.kind &&
          res.operation.key === operation.key &&
          (!res.operation.context._instance ||
            res.operation.context._instance === operation.context._instance)
      ),
      // End the results stream when an active teardown event is sent
      takeUntil(
        pipe(
          operations.source,
          filter(op => op.kind === 'teardown' && op.key === operation.key)
        )
      )
    );

    if (operation.kind !== 'query') {
      // Interrupt subscriptions and mutations when they have no more results
      result$ = pipe(
        result$,
        takeWhile(result => !!result.hasNext, true)
      );
    } else {
      result$ = pipe(
        result$,
        // Add `stale: true` flag when a new operation is sent for queries
        switchMap(result => {
          const value$ = fromValue(result);
          return result.stale || result.hasNext
            ? value$
            : merge([
                value$,
                pipe(
                  operations.source,
                  filter(op => op.key === operation.key),
                  take(1),
                  map(() => {
                    result.stale = true;
                    return result;
                  })
                ),
              ]);
        })
      );
    }

    if (operation.kind !== 'mutation') {
      result$ = pipe(
        result$,
        // Store replay result
        onPush(result => {
          if (result.stale) {
            // If the current result has queued up an operation of the same
            // key, then `stale` refers to it
            for (const operation of queue) {
              if (operation.key === result.operation.key) {
                dispatched.delete(operation.key);
                break;
              }
            }
          } else if (!result.hasNext) {
            dispatched.delete(operation.key);
          }
          replays.set(operation.key, result);
        }),
        // Cleanup active states on end of source
        onEnd(() => {
          // Delete the active operation handle
          dispatched.delete(operation.key);
          replays.delete(operation.key);
          active.delete(operation.key);
          // Interrupt active queue
          isOperationBatchActive = false;
          // Delete all queued up operations of the same key on end
          for (let i = queue.length - 1; i >= 0; i--)
            if (queue[i].key === operation.key) queue.splice(i, 1);
          // Dispatch a teardown signal for the stopped operation
          nextOperation(
            makeOperation('teardown', operation, operation.context)
          );
        })
      );
    } else {
      result$ = pipe(
        result$,
        // Send mutation operation on start
        onStart(() => {
          nextOperation(operation);
        })
      );
    }

    // Mask typename properties if the option for it is turned on
    if (opts.maskTypename) {
      result$ = pipe(
        result$,
        map(res => ({ ...res, data: maskTypename(res.data, true) }))
      );
    }

    return share(result$);
  };

  const instance: Client =
    this instanceof Client ? this : Object.create(Client.prototype);
  const client: Client = Object.assign(instance, {
    suspense: !!opts.suspense,
    operations$: operations.source,

    reexecuteOperation(operation: Operation) {
      // Reexecute operation only if any subscribers are still subscribed to the
      // operation's exchange results
      if (operation.kind === 'teardown') {
        dispatchOperation(operation);
      } else if (operation.kind === 'mutation' || active.has(operation.key)) {
        queue.push(operation);
        Promise.resolve().then(dispatchOperation);
      }
    },

    createRequestOperation(kind, request, opts) {
      if (!opts) opts = {};

      let requestOperationType: string | undefined;
      if (
        process.env.NODE_ENV !== 'production' &&
        kind !== 'teardown' &&
        (requestOperationType = getOperationType(request.query)) !== kind
      ) {
        throw new Error(
          `Expected operation of type "${kind}" but found "${requestOperationType}"`
        );
      }

      return makeOperation(kind, request, {
        _instance:
          kind === 'mutation'
            ? ((ids = (ids + 1) | 0) as OperationInstance)
            : undefined,
        ...baseOpts,
        ...opts,
        requestPolicy: opts.requestPolicy || baseOpts.requestPolicy,
        suspense: opts.suspense || (opts.suspense !== false && client.suspense),
      });
    },

    executeRequestOperation(operation) {
      if (operation.kind === 'mutation') {
        return withPromise(makeResultSource(operation));
      }

      return withPromise(
        lazy<OperationResult>(() => {
          let source = active.get(operation.key);
          if (!source) {
            active.set(operation.key, (source = makeResultSource(operation)));
          }

          source = pipe(
            source,
            onStart(() => {
              dispatchOperation(operation);
            })
          );

          const replay = replays.get(operation.key);
          if (
            operation.kind === 'query' &&
            replay &&
            (replay.stale || replay.hasNext)
          ) {
            return pipe(
              merge([
                source,
                pipe(
                  fromValue(replay),
                  filter(replay => replay === replays.get(operation.key))
                ),
              ]),
              switchMap(fromValue)
            );
          } else {
            return source;
          }
        })
      );
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

    query(query, variables, context) {
      return client.executeQuery(createRequest(query, variables), context);
    },

    subscription(query, variables, context) {
      return client.executeSubscription(
        createRequest(query, variables),
        context
      );
    },

    mutation(query, variables, context) {
      return client.executeMutation(createRequest(query, variables), context);
    },
  } as Client);

  let dispatchDebug: ExchangeInput['dispatchDebug'] = noop;
  if (process.env.NODE_ENV !== 'production') {
    const { next, source } = makeSubject<DebugEvent>();
    client.subscribeToDebugTarget = (onEvent: (e: DebugEvent) => void) =>
      pipe(source, subscribe(onEvent));
    dispatchDebug = next as ExchangeInput['dispatchDebug'];
  }

  // All exchange are composed into a single one and are called using the constructed client
  // and the fallback exchange stream
  const composedExchange = composeExchanges(opts.exchanges);

  // All exchanges receive inputs using which they can forward operations to the next exchange
  // and receive a stream of results in return, access the client, or dispatch debugging events
  // All operations then run through the Exchange IOs in a pipeline-like fashion
  const results$ = share(
    composedExchange({
      client,
      dispatchDebug,
      forward: fallbackExchange({ dispatchDebug }),
    })(operations.source)
  );

  // Prevent the `results$` exchange pipeline from being closed by active
  // cancellations cascading up from components
  pipe(results$, publish);

  return client;
} as any;

/** Accepts `ClientOptions` and creates a `Client`.
 * @param opts - A {@link ClientOptions} objects with options for the `Client`.
 * @returns A {@link Client} instantiated with `opts`.
 */
export const createClient = Client as any as (opts: ClientOptions) => Client;

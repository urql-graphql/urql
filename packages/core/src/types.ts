import type { GraphQLError, DocumentNode } from 'graphql';
import { Source } from 'wonka';
import { Client } from './client';
import { CombinedError } from './utils/error';

/** A GraphQL `DocumentNode` with attached generics for its result data and variables.
 *
 * @remarks
 * A GraphQL {@link DocumentNode} defines both the variables it accepts on request and the `data`
 * shape it delivers on a response in the GraphQL query language.
 *
 * To bridge the gap to TypeScript, tools may be used to generate TypeScript types that define the shape
 * of `data` and `variables` ahead of time. These types are then attached to GraphQL documents using this
 * `TypedDocumentNode` type.
 *
 * Using a `DocumentNode` that is typed like this will cause any `urql` API to type its input `variables`
 * and resulting `data` using the types provided.
 *
 * @privateRemarks
 * For compatibility reasons this type has been copied and internalized from:
 * https://github.com/dotansimha/graphql-typed-document-node/blob/3711b12/packages/core/src/index.ts#L3-L10
 *
 * @see {@link https://github.com/dotansimha/graphql-typed-document-node} for more information.
 */
export interface TypedDocumentNode<
  Result = { [key: string]: any },
  Variables = { [key: string]: any }
> extends DocumentNode {
  /** Type to check whether `Variables` and `Result` are assignable types.
   * @internal
   */
  __apiType?: (variables: Variables) => Result;
}

/** A list of errors on {@link ExecutionResult | ExecutionResults}.
 * @see {@link https://spec.graphql.org/draft/#sec-Errors.Error-Result-Format} for the GraphQL Error Result format spec.
 */
type ErrorLike = Partial<GraphQLError> | Error;
/** Extensions which may be placed on {@link ExecutionResult | ExecutionResults}.
 * @see {@link https://spec.graphql.org/draft/#sel-EAPHJCAACCoGu9J} for the GraphQL Error Result format spec.
 */
type Extensions = Record<string, any>;

/** Incremental Payloads sent as part of "Incremental Delivery" patching prior result data.
 *
 * @remarks
 * "Incremental Delivery" works by allowing APIs to stream patches to the client, whih update
 * prior results at the specified `path`.
 *
 * @see {@link https://github.com/graphql/graphql-spec/blob/94363c9/spec/Section%207%20--%20Response.md#incremental} for the incremental payload spec
 */
export interface IncrementalPayload {
  /** Optional label for the incremental payload that corresponds to directives' labels.
   *
   * @remarks
   * All incremental payloads are labelled by the label that `@stream` or `@defer` directives
   * specified, to identify which directive they originally belonged to.
   */
  label?: string | null;
  /** JSON patch at which to apply the `data` patch or append the `items`.
   *
   * @remarks
   * The `path` indicates the JSON path of a prior result’s `data` structure at which
   * to insert the patch’s data.
   * When `items` is set instead, which represents a list of items to insert, the last
   * entry of the `path` will be an index number at which to start setting the range of
   * items.
   */
  path: readonly (string | number)[];
  /** Data to patch into the result data at the given `path`.
   *
   * @remarks
   * This `data`, when set, is merged into the object at the given `path` of the last
   * result that has been delivered.
   * This isn't set when `items` is set.
   */
  data?: Record<string, unknown> | null;
  /** List of items to patch into the result data at the given `path`.
   *
   * @remarks
   * The `items`, when provided, is set onto a range in an array, at the given JSON
   * `path`. The start index is the last entry of the `path` and the end index is
   * the length of the `items` list added to this index.
   * This isn't set when `data` is set.
   */
  items?: readonly unknown[] | null;
  /** Contains a list of errors raised by incremental payloads.
   *
   * @remarks
   * The list of `errors` on `incremental` payloads is merged into the list of prior
   * results’ errors.
   *
   * @see {@link https://spec.graphql.org/October2021/#sec-Errors} for the GraphQL Errors Response spec
   */
  errors?: ErrorLike[] | readonly ErrorLike[];
  /** Additional metadata that a GraphQL API may choose to send that is out of spec.
   * @see {@link https://spec.graphql.org/October2021/#sel-EAPHJCAACCoGu9J} for the GraphQL Response spec
   */
  extensions?: Extensions;
}

export interface ExecutionResult {
  /** Incremental patches to be applied to a previous result as part of "Incremental Delivery".
   *
   * @remarks
   * When this is set `data` and `errors` is typically not set on the result. Instead, the incremental payloads
   * are applied as patches to a prior result's `data`.
   *
   * @see {@link https://github.com/graphql/graphql-spec/blob/94363c9/spec/Section%207%20--%20Response.md#incremental} for the incremental payload spec
   */
  incremental?: IncrementalPayload[];
  /** The result of the execution of the GraphQL operation.
   * @see {@link https://spec.graphql.org/October2021/#sec-Data} for the GraphQL Data Response spec
   */
  data?: null | Record<string, any>;
  /** Contains a list of errors raised by fields or the request itself.
   * @see {@link https://spec.graphql.org/October2021/#sec-Errors} for the GraphQL Errors Response spec
   */
  errors?: ErrorLike[] | readonly ErrorLike[];
  /** Additional metadata that a GraphQL API may choose to send that is out of spec.
   * @see {@link https://spec.graphql.org/October2021/#sel-EAPHJCAACCoGu9J} for the GraphQL Response spec
   */
  extensions?: Extensions;
  /** Flag indicating whether a future, incremental response may update this response.
   * @see {@link https://github.com/graphql/graphql-wg/blob/main/rfcs/DeferStream.md#payload-format} for the DeferStream spec
   */
  hasNext?: boolean;
}

/** A `Source` with a `PromisifiedSource.toPromise` helper method, to promisify a single result.
 *
 * @remarks
 * The {@link Client} will often return a `PromisifiedSource` to provide the `toPromise` method. When called, this returns
 * a promise of the source that resolves on the first {@link OperationResult} of the `Source` that doesn't have `stale: true`
 * nor `hasNext: true` set, meaning, it'll resolve to the first result that is stable and complete.
 */
export type PromisifiedSource<T = any> = Source<T> & {
  toPromise: () => Promise<T>;
};

/** A type of Operation, either a GraphQL `query`, `mutation`, or `subscription`; or a `teardown` signal.
 *
 * @remarks
 * Internally, {@link Operation | Operations} instruct the {@link Client} to perform a certain action on its exchanges.
 * Any of the three GraphQL operations tell it to execute these operations, and the `teardown` signal instructs it that
 * the operations are cancelled and/or have ended.
 *
 * The `teardown` signal is sent when nothing is subscribed to an operation anymore and no longer interested in its results
 * or any updates.
 */
export type OperationType = 'subscription' | 'query' | 'mutation' | 'teardown';

/** The request and caching strategy that is used by exchanges to retrive cached results.
 *
 * @remarks
 * The `RequestPolicy` is used by cache exchanges to decide how a query operation may be resolved with cached results.h
 * A cache exchange may behave differently depending on which policy is returned.
 *
 * - `cache-first` (the default) prefers cached results and falls back to sending an API request.
 * - `cache-and-network` returns cached results but also always sends an API request in the background.
 * - `network-only` will ignore any cached results and send an API request.
 * - `cache-only` will always return cached results and prevent API requests.
 */
export type RequestPolicy =
  | 'cache-first'
  | 'cache-and-network'
  | 'network-only'
  | 'cache-only';

/** A metadata flag set by cache exchanges to indicate whether a cache miss, a cache hit, or a partial cache hit has occurred.
 *
 * @remarks
 * A cache exchange may update {@link OperationDebugMeta.cacheOutcome} on {@link OperationContext.meta} to indicate whether
 * an operation has been resolved from the cache.
 *
 * A cache hit is considered a result that has fully come from a cache. A partial result is a result that has come from a cache
 * but is incomplete, which may trigger another API request. A cache miss means a result must be requested from the API as no
 * cache result has been delivered.
 */
export type CacheOutcome = 'miss' | 'partial' | 'hit';

/** A default type for variables.
 *
 * @remarks
 * While {@link TypedDocumentNode} can be used by generators to add TypeScript types for a GraphQL operation’s
 * variables and result, when this isn’t the case this type is used as a fallback for the `Variables` generic.
 */
export type AnyVariables = { [prop: string]: any } | void | undefined;

/** A GraphQL request representing a single execution in GraphQL.
 *
 * @remarks
 * A `GraphQLRequest` is a single executable request that may be used by a cache or a GraphQL API to deliver a result.
 * A request contains a `DocumentNode` for the query document of a GraphQL operation and the `variables` for the given
 * request.
 *
 * A unique `key` is generated to identify the request internally by `urql`. Two requests with the same query and
 * variables will share the same `key`.
 *
 * The `Data` and `Variables` generics may be provided by a {@link TypedDocumentNode}, adding TypeScript types for what
 * the result shape and variables shape are.
 *
 * @see {@link https://spec.graphql.org/October2021/#sec-Executing-Requests} for more information on GraphQL reuqests.
 */
export interface GraphQLRequest<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> {
  /** Unique identifier for the `GraphQLRequest`.
   *
   * @remarks
   * This is a key that combines the unique key of the `query` and the `variables` into a unique
   * `key` for the `GraphQLRequest`. Any request with the same query and variables will have a unique
   * `key` by which results and requests can be identified as identical.
   *
   * Internally, a stable, cached `key` is generated for the `DocumentNode` and for the `variables` and
   * both will be combined into a combined `key` which is set here, based on a DJB2 hash,
   *
   * The `variables` will change the key even if they contain a non-JSON reference. If you pass a custom
   * class instance to `variables` that doesn't contain a `toString` or `toJSON` method, a stable but random
   * identifier will replace this class to generate a key.
   */
  key: number;
  /** A GraphQL document to execute against a cache or API.
   *
   * @remarks
   * A `GraphQLRequest` is executed against an operation in a GraphQL document.
   * In `urql`, we expect a document to only contain a single operation that is executed rather than
   * multiple ones by convention.
   */
  query: DocumentNode | TypedDocumentNode<Data, Variables>;
  /** Variables used to execute the `query` document.
   *
   * @remarks
   * The `variables`, based either on the {@link AnyVariables} type or the {@link TypedDocumentNode}'s provided
   * generic, are sent to the GraphQL API to execute a request.
   */
  variables: Variables;
  /** Additional metadata that a GraphQL API may accept for spec extensions.
   * @see {@link https://github.com/graphql/graphql-over-http/blob/1928447/spec/GraphQLOverHTTP.md#request-parameters} for the GraphQL over HTTP spec
   */
  extensions?: Record<string, any> | undefined;
}

/** Parameters from which {@link GraphQLRequest | GraphQLRequests} are created from.
 *
 * @remarks
 * A `GraphQLRequest` is a single executable request with a generated `key` to identify
 * their results, whereas `GraphQLRequestParams` is a utility type used to generate
 * inputs for `urql` to create requests from, i.e. it only contains a `query` and
 * `variables`. The type conditionally makes the `variables` property completely
 * optional.
 *
 * @privateRemarks
 * The wrapping union type is needed for passthrough or wrapper utilities that wrap
 * functions like `useQuery` with generics.
 */
export type GraphQLRequestParams<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> =
  | ({
      query: string | DocumentNode | TypedDocumentNode<Data, Variables>;
    } & (Variables extends void
      ? {
          variables?: Variables;
        }
      : Variables extends {
          [P in keyof Variables]: Exclude<Variables[P], null | void>;
        }
      ? Variables extends {
          [P in keyof Variables]: never;
        }
        ? {
            variables?: Variables;
          }
        : {
            variables: Variables;
          }
      : {
          variables?: Variables;
        }))
  | {
      query: string | DocumentNode | TypedDocumentNode<Data, Variables>;
      variables: Variables;
    };

/** Metadata used to annotate an `Operation` in development for the `urql-devtools`.
 *
 * @remarks
 * The `OperationDebugMeta` is found on {@link OperationContext.meta} only in development,
 * and is used to send additional metadata to the `urql-devtools` about the {@link Operation}.
 *
 * In production, most of this metadata will be missing, and it must not be used outside
 * of development, and should only be used by the `urql-devtools`.
 */
export interface OperationDebugMeta {
  /** A label for the source of the `Operation`.
   *
   * @remarks
   * The `source` string indicates a human readable originator for the `Operation`.
   * This may be set to a component name or function name to indicate what originally
   * triggered the `Operation`.
   */
  source?: string;
  /** A type of caching outcome set by cache exchanges on `OperationResult`s.
   *
   * @remarks
   * The `cacheOutcome` flag is set to a {@link CacheOutcome} on {@link Operation | Operations}
   * after they passed through the cache exchange. This flag indicates whether a cache hit, miss,
   * or partial cache hit has occurred.
   */
  cacheOutcome?: CacheOutcome;
  /** Reserved to indicate the time it took for a GraphQL request to receive a response from a GraphQL API.
   *
   * @remarks
   * The `networkLatency` may be set to the time it took (in ms) for a GraphQL API to respond to a request
   * and deliver a result.
   * @internal
   */
  networkLatency?: number;
  /** Reserved to indicate the timestamp at which a GraphQL request was sent to a GraphQL API.
   *
   * @remarks
   * The `startTime` is set to an epoch timestamp (in ms) at which a GraphQL request was started
   * and sent to a GraphQL API.
   * @internal
   */
  startTime?: number;
}

/** A unique identity for GraphQL mutations.
 *
 * @remarks
 * GraphQL mutations not only use {@link GraphQLRequest.key} to identify a result, but instead use
 * an identity to mark which result belongs to them.
 *
 * While two GraphQL queries and subscriptions sharing the same variables and the same operation
 * (i.e. `DocumentNode`) are considered identical, two mutations are not.
 * Two GraphQL queries or subscription results with the same {@link GraphQLRequest.key} can be used
 * to resolve any {@link GraphQLRequest} with this same `key`.
 * This is because identical queries and subscriptions are idempotent.
 *
 * However, two mutations with the same variables may receive different results from a GraphQL API,
 * since they may trigger side-effects.
 * This means that `urql` needs an additional identifier to differentiate between two mutations with
 * the same `DocumentNode`s and `variables`.
 */
export type OperationInstance = number & {
  /** Marker to indicate that an `OperationInstance` may not be created by a user.
   *
   * @remarks
   * The {@link Client} creates `OperationInstance` indentities automatically and uses them internally
   * to identify mutations results as belonging to mutation operations. These are just integers (numbers),
   * however, they're used as if they are objects (e.g. `{}`). However, since instances of arrays and
   * objects are not serialisable numbers are used instead.
   *
   * Because these are internal, the TypeScript type is marked using a `unique symbol` because they're
   * created opaquely and privately.
   *
   * @internal
   */
  readonly _opaque: unique symbol;
};

/** Additional metadata for an `Operation` used to execute it.
 *
 * @remarks
 * The `OperationContext` is found on {@link Operation.context} and gives exchanges additional metadata
 * and options used to execute the operation.
 *
 * The context can often be changed on a per-operation basis, meaning, APIs on the {@link Client} or
 * bindings can pass a partial context that alters these options for a single operation.
 *
 * The `OperationContext` is populated mostly from the initial options passed to the `Client` at its
 * time of creation, but may also be modified by exchanges when an {@link Operation} is passed through
 * to the next exchange or when a result is returned.
 */
export interface OperationContext {
  /** A unique identity for GraphQL mutations.
   *
   * @remarks
   * This is an internal property set by the `Client` to an identity of type {@link OperationInstance}.
   * An `OperationInstance` is an identifier that's used to tell two mutation operations with identical
   * `query` documents and `variables` apart from one another.
   * @internal
   */
  readonly _instance?: OperationInstance | undefined;
  /** Additional cache tags for `@urql/core`'s document `cacheExchange`.
   *
   * @remarks
   * The built-in {@link cacheExchange} in `@urql/core` is a document cache that uses `__typename`s in
   * mutation results to invalidate past, cached queries.
   * The `additionalTypenames` array may be set to the list of custom typenames whenever a result may
   * not deliver `__typename` properties, e.g. when an empty array may be sent.
   *
   * By providing a list of custom typenames you may "tag" a result as containing a certain type, which
   * helps the document cache associate mutations with queries when either don't actually contain a
   * `__typename` in the JSON result.
   */
  additionalTypenames?: string[];
  /** The `fetch` function used to make API calls.
   *
   * @remarks
   * This is the fetch polyfill used by any fetch exchange to make an API request. By default, when this
   * option isn't set, any fetch exchange will attempt to use the globally available `fetch` function
   * to make a request instead.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API} for the Fetch API spec.
   */
  fetch?: typeof fetch;
  /** The `url` passed to the `fetch` call on API requests.
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/fetch} for a description of the `fetch` calls.
   */
  url: string;
  /** Additional options passed to the `fetch` call on API requests.
   *
   * @remarks
   * The options in this object or an object returned by a callback function will be merged into the
   * {@link RequestInit} options passed to the `fetch` call.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/fetch} for a description of this object.
   */
  fetchOptions?: RequestInit | (() => RequestInit);
  /** The request and caching strategy instructing cache exchanges how to treat cached results.
   *
   * @remarks
   * The {@link RequestPolicy} instructing cache exchanges how to use and treat their cached results.
   * By default `cache-first` is set and used, which will use cache results, and only make an API request
   * on a cache miss.
   */
  requestPolicy: RequestPolicy;
  /** Metadata that annotates an `Operation` in development for the `urql-devtools`.
   *
   * @remarks
   * This is metadata that is used by the `urql-devtools` to get more information about `Operation`s and
   * `OperationResult`s and is filled in by exchanges across the codebase in development.
   *
   * This data is not for production use and hence shouldn't be used or relied upon directly.
   * In production, this may not be set by default exchanges.
   */
  meta?: OperationDebugMeta;
  /** Instructs fetch exchanges to use a GET request.
   *
   * @remarks
   * By default, GraphQL over HTTP requests are always sent as POST requests with a JSON body.
   * However, sometimes it's preferable to send a GET request instead, for instance, for caching with or
   * without persisted queries.
   *
   * When set to `true`, the `preferGetMethod` instructs fetch exchanges to instead send a GET request
   * for query operations.
   *
   * Additionally, `urql`'s built-in fetch exchanges will default to `'within-url-limit'` and not send a GET request
   * when the resulting URL would be 2,048 characters or longer. This can be forced and circumvented by setting
   * this option to `'force'`.
   */
  preferGetMethod?: boolean | 'force' | 'within-url-limit';
  /** A configuration flag indicating whether this operation may trigger "Suspense".
   *
   * @remarks
   * This configuration flag is reserved for `urql` (`react-urql`) and `@urql/preact` to activate or
   * deactivate support for Suspense, and is ignored in other bindings.
   * When activated here and on {@link `Client.suspense`} it allows the bindings to "suspend" instead
   * of returning a loading state, which will stop updates in a querying component and instead cascade
   * to a higher suspense boundary for a loading state.
   *
   * @see {@link https://beta.reactjs.org/blog/2022/03/29/react-v18#new-suspense-features} for more information on React Suspense.
   */
  suspense?: boolean;
  [key: string]: any;
}

/** The inputs to `urql`'s Exchange pipeline to instruct them to execute a GraphQL operation.
 *
 * @remarks
 * An `Operation`, in `urql`, starts a {@link GraphQLRequest} and are events. The `kind` of an `Operation` can
 * be set to any operation kind of GraphQL, namely `query`, `mutation`, or `subscription`. To terminate an
 * operation, once it's cancelled, a `teardown` kind event is sent.
 *
 * The {@link ExchangeIO} type describes how {@link Exchange | Exchanges} receive `Operation`s and return
 * `OperationResults`, using `teardown` `Operation`s to cancel ongoing operations.
 *
 * @see {@link https://formidable.com/open-source/urql/docs/architecture/#the-client-and-exchanges} for more information
 * on the flow of Exchanges.
 */
export interface Operation<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> extends GraphQLRequest<Data, Variables> {
  /** The `OperationType` describing the kind of `Operation`.
   *
   * @remarks
   * This is used to describe what to do with the {@link GraphQLRequest} of an {@link Operation} and is set
   * to a GraphQL operation type (`query`, `mutation`, or `subscription`) to start an `Operation`; and to
   * `teardown` to cancel an operation, which either terminates it early or lets exchanges know that no
   * consumer is interested in this operation any longer.
   */
  readonly kind: OperationType;
  /** Holds additional metadata for an `Operation` used to execute it.
   *
   * @remarks
   * The {@link OperationContext} is created by the {@link Client} but may also be modified by
   * {@link Exchange | Exchanges} and is used as metadata by them.
   */
  context: OperationContext;
}

/** A result for an `Operation` carrying a full GraphQL response.
 *
 * @remarks
 * An `OperationResult` is the result of an {@link Operation} and carry a description of the full response
 * on them. The {@link OperationResult.operation} is set to the `Operation` that this result fulfils.
 *
 * Unlike {@link ExecutionResult}, an `OperationResult` will never be an incremental result and will
 * always match the fully merged type of a GraphQL request. It essentially is a postprocessed version
 * of a GraphQL API response.
 */
export interface OperationResult<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> {
  /** The [operation]{@link Operation} which has been executed. */
  /** The `Operation` which this `OperationResult` is for.
   *
   * @remarks
   * The `operation` property is set to the {@link Operation} that this result is. At the time the
   * {@link OperationResult} is constructed (either from the cache or an API response) the original
   * `Operation` that the exchange delivering this result has received will be added.
   *
   * The {@link Client} uses this to identify which {@link Operation} this {@link OperationResult} is
   * for and to filter and deliver this result to the right place and consumers.
   */
  operation: Operation<Data, Variables>;
  /** The result of the execution of the GraphQL operation.
   * @see {@link https://spec.graphql.org/October2021/#sec-Data} for the GraphQL Data Response spec
   */
  data?: Data;
  /** Contains a description of errors raised by GraphQL fields or the request itself by the API.
   *
   * @remarks
   * The `error` of an `OperationResult` is set to a {@link CombinedError} if the GraphQL API response
   * contained any GraphQL errors.
   *
   * GraphQL errors occur when either a GraphQL request was prevented from executing entirely
   * (at which point `data: undefined` is set) or when one or more fields of a GraphQL request
   * failed to execute. Due to the latter, you may receive partial data when a GraphQL request
   * partially failed.
   */
  error?: CombinedError;
  /** Additional metadata that a GraphQL API may choose to send that is out of spec.
   * @see {@link https://spec.graphql.org/October2021/#sel-EAPHJCAACCoGu9J} for the GraphQL Response spec
   */
  extensions?: Record<string, any>;
  /** Indicates that an `OperationResult` is not fresh and a new result will follow.
   *
   * @remarks
   * The `stale` flag indicates whether a result is expected to be superseded by a new result soon.
   * This flag is set whenever a new result is being awaited and will be deliverd as soon as the API responds.
   *
   * It may be set by the {@link Client} when the `Operation` was already active, at which point
   * the {@link Client} asks the {@link Exchange | Exchanges} to request a new API response, or
   * by cache exchanges when a temporary, incomplete, or initial cache result has been deliverd, and
   * a new API request has been started in the background. (For partial cache results)
   *
   * Most commonly, this flag is set for a cached result when the operation is executed using the
   * `cache-and-network` {@link RequestPolicy}.
   */
  stale: boolean;
  /** Indicates that the GraphQL response is streamed and updated results will follow.
   *
   * @remarks
   * Due to incremental delivery, an API may deliver multiple {@link ExecutionResult | ExecutionResults} for a
   * single GraphQL request. This can happen for `@defer`, `@stream`, or `@live` queries, which allow an API
   * to update an initial GraphQL response over time, like a subscription.
   *
   * For GraphQL subscriptions, this flag will always be set to `true`.
   */
  hasNext: boolean;
}

/** The input parameters a `Client` passes to an `Exchange` when it's created.
 *
 * @remarks
 * When instantiated, a {@link Client} passes these inputs parameters to an {@link Exchange}.
 *
 * This input contains the `Client` itself, a `dispatchDebug` function for the `urql-devtools`, and
 * `forward`, which is set to the next exchange's {@link ExchangeIO} function in the exchange pipeline.
 */
export interface ExchangeInput {
  /** The `Client` that is using this `Exchange`.
   *
   * @remarks
   * The {@link Client} instantiating the {@link Exchange} will call it with the `ExchangeInput` object,
   * while setting `client` to itself.
   *
   * Exchanges use methods like {@link Client.reexecuteOperation} to issue {@link Operation | Operations}
   * themselves, and communicate with the exchange pipeline as a whole.
   */
  client: Client;
  /** The next `Exchange`'s {@link ExchangeIO} function in the pipeline.
   *
   * @remarks
   * `Exchange`s are like middleware function, and are henced composed like a recursive pipeline.
   * Each `Exchange` will receive the next `Exchange`'s {@link ExchangeIO} function which they
   * then call to compose each other.
   *
   * Since each `Exchange` calls the next, this creates a pipeline where operations are forwarded
   * in sequence and `OperationResult`s from the next `Exchange` are combined with the current.
   */
  forward: ExchangeIO;
  /** Issues a debug event to the `urql-devtools`.
   *
   * @remarks
   * If `@urql/devtools` are set up, this dispatch function issues events to the `urql-devtools`.
   * These events give the devtools more granular insights on what's going on in exchanges asynchronously,
   * since `Operation`s and `OperationResult`s only signify the “start” and “end” of a request.
   */
  dispatchDebug<T extends keyof DebugEventTypes | string>(
    t: DebugEventArg<T>
  ): void;
}

/** `Exchange`s are both extensions for a `Client` and part of the control-flow executing `Operation`s.
 *
 * @remarks
 * `Exchange`s are responsible for the pipeline in `urql` that accepts {@link Operation | Operations} and
 * returns {@link OperationResult | OperationResults}. They take care of adding functionality to a {@link Client},
 * like deduplication, caching, and fetching (i.e. making GraphQL requests).
 *
 * When passed to the `Client`, they're instantiated with the {@link ExchangeInput} object and return an {@link ExchangeIO}
 * function, which is a mapping function that receives a stream of `Operation`s and returns a stream of `OperationResult`s.
 *
 * Like middleware, exchanges are composed, calling each other in a pipeline-like fashion, which is facilitated by exchanges
 * calling {@link ExchangeInput.forward}, which is set to the next exchange's {@link ExchangeIO} function in the pipeline.
 *
 * @see {@link https://formidable.com/open-source/urql/docs/architecture/#the-client-and-exchanges} for more information on Exchanges.
 * @see {@link https://formidable.com/open-source/urql/docs/advanced/authoring-exchanges/} on how Exchanges are authored.
 */
export type Exchange = (input: ExchangeInput) => ExchangeIO;

/** Returned by `Exchange`s, the `ExchangeIO` function are the composed pipeline functions.
 *
 * @remarks
 * An {@link Exchange} must return an `ExchangeIO` function, which accepts a stream of {@link Operation | Operations} which
 * this exchange handles and returns a stream of {@link OperationResult | OperationResults}. These streams are Wonka {@link Source | Sources}.
 *
 * An exchange may enhance the incoming stream of `Operation`s to add, filter, map (change), or remove `Operation`s, before
 * forwarding those to {@link ExchangeInput.forward}, using Wonka's operators, and may add or remove `OperationResult`s from
 * the returned stream.
 *
 * Generally, the stream of `OperationResult` returned by {@link ExchangeInput.forward} is always merged and combined with
 * the `Exchange`'s own stream of results if the `Exchange` creates and delivers results of its own.
 *
 * @see {@link https://formidable.com/open-source/urql/docs/advanced/authoring-exchanges/} on how Exchanges are authored.
 */
export type ExchangeIO = (ops$: Source<Operation>) => Source<OperationResult>;

/** A mapping type of debug event types to their payloads.
 *
 * @remarks
 * These are the debug events that {@link ExchangeInput.dispatchDebug} accepts mapped to the payloads these events carry.
 * Debug events are only used in development and only consumed by the `urql-devtools`.
 */
export interface DebugEventTypes {
  /** Signals to the devtools that a cache exchange will deliver a cached result. */
  cacheHit: { value: any };
  /** Signals to the devtools that a cache exchange will invalidate a cached result. */
  cacheInvalidation: {
    typenames: string[];
    response: OperationResult;
  };
  /** Signals to the devtools that a fetch exchange will make a GraphQL API request. */
  fetchRequest: {
    url: string;
    fetchOptions: RequestInit;
  };
  /** Signals to the devtools that a fetch exchange has received a GraphQL API response successfully. */
  fetchSuccess: {
    url: string;
    fetchOptions: RequestInit;
    value: object;
  };
  /** Signals to the devtools that a fetch exchange has failed to execute a GraphQL API request. */
  fetchError: {
    url: string;
    fetchOptions: RequestInit;
    value: Error;
  };
  /** Signals to the devtools that a retry exchange will retry an Operation. */
  retryRetrying: {
    retryCount: number;
  };
}

/** Utility type that maps a debug event type to its payload.
 *
 * @remarks
 * This is a utility type that determines the required payload for a given debug event, which is
 * sent to the `urql-devtools`.
 *
 * The payloads for known debug events are defined by the {@link DebugEventTypes} type, and
 * each event additionally carries a human readable `message` with it, and the {@link Operation}
 * for which the event is.
 *
 * @internal
 */
export type DebugEventArg<T extends keyof DebugEventTypes | string> = {
  type: T;
  message: string;
  operation: Operation;
} & (T extends keyof DebugEventTypes
  ? { data: DebugEventTypes[T] }
  : { data?: any });

/** Utility type of the full payload that is sent to the `urql-devtools`.
 *
 * @remarks
 * While the {@link DebugEventArg} defines the payload that {@link ExchangeInput.dispatchDebug}
 * accepts, each debug event then receives additional properties which are sent to the `urql-devtools`,
 * which this type defines.
 * @internal
 */
export type DebugEvent<
  T extends keyof DebugEventTypes | string = string
> = DebugEventArg<T> & {
  timestamp: number;
  source: string;
};

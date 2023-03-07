import type { GraphQLError, DocumentNode } from 'graphql';
import { Source } from 'wonka';
import { Client } from './client';
import { CombinedError } from './utils/error';

// NOTE: This is mirrored from @graphql-typed-document-node/core and must match this type exactly.
// It has been copied here to avoid tooling problems where build systems get confused about the type-only nature of this package.
// See for original: https://github.com/dotansimha/graphql-typed-document-node/blob/3711b12/packages/core/src/index.ts#L3-L10
export interface TypedDocumentNode<
  Result = { [key: string]: any },
  Variables = { [key: string]: any }
> extends DocumentNode {
  /**
   * This type is used to ensure that the variables you pass in to the query are assignable to Variables
   * and that the Result is assignable to whatever you pass your result to. The method is never actually
   * implemented, but the type is valid because we list it as optional
   */
  __apiType?: (variables: Variables) => Result;
}

type ErrorLike = Partial<GraphQLError> | Error;
type Extensions = Record<string, any>;

export interface IncrementalPayload {
  label?: string | null;
  path: readonly (string | number)[];
  data?: Record<string, unknown> | null;
  items?: readonly unknown[] | null;
  errors?: ErrorLike[] | readonly ErrorLike[];
  extensions?: Extensions;
}

export interface ExecutionResult {
  incremental?: IncrementalPayload[];
  data?: null | Record<string, any>;
  errors?: ErrorLike[] | readonly ErrorLike[];
  extensions?: Extensions;
  hasNext?: boolean;
}

export type PromisifiedSource<T = any> = Source<T> & {
  toPromise: () => Promise<T>;
};

/** The type of GraphQL operation being executed. */
export type OperationType = 'subscription' | 'query' | 'mutation' | 'teardown';

/** The strategy that is used to request results from network and/or the cache. */
export type RequestPolicy =
  | 'cache-first'
  | 'cache-only'
  | 'network-only'
  | 'cache-and-network';

/** How the operation has */
export type CacheOutcome = 'miss' | 'partial' | 'hit';

/** A default type for variables */
export type AnyVariables = { [prop: string]: any } | void | undefined;

/** A Graphql query, mutation, or subscription. */
export interface GraphQLRequest<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> {
  /** Unique identifier of the request. */
  key: number;
  query: DocumentNode | TypedDocumentNode<Data, Variables>;
  variables: Variables;
}

/** Metadata that is only available in development for devtools. */
export interface OperationDebugMeta {
  source?: string;
  cacheOutcome?: CacheOutcome;
  networkLatency?: number;
  startTime?: number;
}

/** A unique marker that marks the operation's identity when multiple mutation operations with identical keys are issued. */
export type OperationInstance = number & { readonly _opaque: unique symbol };

/** Additional metadata passed to [exchange]{@link Exchange} functions. */
export interface OperationContext {
  [key: string]: any;
  readonly _instance?: OperationInstance | undefined;
  additionalTypenames?: string[];
  fetch?: typeof fetch;
  fetchOptions?: RequestInit | (() => RequestInit);
  requestPolicy: RequestPolicy;
  url: string;
  meta?: OperationDebugMeta;
  suspense?: boolean;
  /** Instructs fetch exchanges to use a GET request.
   * When true or 'within-url-limit' is passed, GET won't be used when the resulting URL exceeds a length of 2048. */
  preferGetMethod?: boolean | 'force' | 'within-url-limit';
}

/** A [query]{@link Query} or [mutation]{@link Mutation} with additional metadata for use during transmission. */
export interface Operation<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> extends GraphQLRequest<Data, Variables> {
  readonly kind: OperationType;
  context: OperationContext;
}

/** Resulting data from an [operation]{@link Operation}. */
export interface OperationResult<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> {
  /** The [operation]{@link Operation} which has been executed. */
  operation: Operation<Data, Variables>;
  /** The data returned from the Graphql server. */
  data?: Data;
  /** Any errors resulting from the operation. */
  error?: CombinedError;
  /** Optional extensions return by the Graphql server. */
  extensions?: Record<string, any>;
  /** Optional stale flag added by exchanges that return stale results. */
  stale?: boolean;
  /** Optional hasNext flag indicating deferred/streamed results are following. */
  hasNext?: boolean;
}

/** Input parameters for to an Exchange factory function. */
export interface ExchangeInput {
  client: Client;
  forward: ExchangeIO;
  dispatchDebug: <T extends keyof DebugEventTypes | string>(
    t: DebugEventArg<T>
  ) => void;
}

/** Function responsible for listening for streamed [operations]{@link Operation}. */
export type Exchange = (input: ExchangeInput) => ExchangeIO;

/** Function responsible for receiving an observable [operation]{@link Operation} and returning a [result]{@link OperationResult}. */
export type ExchangeIO = (ops$: Source<Operation>) => Source<OperationResult>;

/** Debug event types (interfaced for declaration merging). */
export interface DebugEventTypes {
  // Cache exchange
  cacheHit: { value: any };
  cacheInvalidation: {
    typenames: string[];
    response: OperationResult;
  };
  // Fetch exchange
  fetchRequest: {
    url: string;
    fetchOptions: RequestInit;
  };
  fetchSuccess: {
    url: string;
    fetchOptions: RequestInit;
    value: object;
  };
  fetchError: {
    url: string;
    fetchOptions: RequestInit;
    value: Error;
  };
  // Retry exchange
  retryRetrying: {
    retryCount: number;
  };
}

export type DebugEventArg<T extends keyof DebugEventTypes | string> = {
  type: T;
  message: string;
  operation: Operation;
} & (T extends keyof DebugEventTypes
  ? { data: DebugEventTypes[T] }
  : { data?: any });

export type DebugEvent<
  T extends keyof DebugEventTypes | string = string
> = DebugEventArg<T> & {
  timestamp: number;
  source: string;
};

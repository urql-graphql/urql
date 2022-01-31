import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { GraphQLError, DocumentNode } from 'graphql';
import { Source } from 'wonka';
import { Client } from './client';
import { CombinedError } from './utils/error';

export type ExecutionResult =
  | {
      errors?:
        | Array<Partial<GraphQLError> | string | Error>
        | readonly GraphQLError[];
      data?: null | Record<string, any>;
      extensions?: Record<string, any>;
      hasNext?: boolean;
    }
  | {
      errors?:
        | Array<Partial<GraphQLError> | string | Error>
        | readonly GraphQLError[];
      data: any;
      path: (string | number)[];
      hasNext?: boolean;
    };

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

/** A Graphql query, mutation, or subscription. */
export interface GraphQLRequest<Data = any, Variables = object> {
  /** Unique identifier of the request. */
  key: number;
  query: DocumentNode | TypedDocumentNode<Data, Variables>;
  variables?: Variables;
}

/** Metadata that is only available in development for devtools. */
export interface OperationDebugMeta {
  source?: string;
  cacheOutcome?: CacheOutcome;
  networkLatency?: number;
  startTime?: number;
}

/** Additional metadata passed to [exchange]{@link Exchange} functions. */
export interface OperationContext {
  [key: string]: any;
  readonly _instance?: [] | undefined;
  additionalTypenames?: string[];
  fetch?: typeof fetch;
  fetchOptions?: RequestInit | (() => RequestInit);
  requestPolicy: RequestPolicy;
  url: string;
  meta?: OperationDebugMeta;
  suspense?: boolean;
  preferGetMethod?: boolean;
}

/** A [query]{@link Query} or [mutation]{@link Mutation} with additional metadata for use during transmission. */
export interface Operation<Data = any, Variables = any>
  extends GraphQLRequest<Data, Variables> {
  readonly kind: OperationType;
  context: OperationContext;
}

/** Resulting data from an [operation]{@link Operation}. */
export interface OperationResult<Data = any, Variables = any> {
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

import { DocumentNode } from 'graphql';
import { Source } from 'wonka';
import { Client } from './client';
import { CombinedError } from './utils/error';

export { ExecutionResult } from 'graphql';

/** Utility type to Omit keys from an interface/object type */
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/** The type of GraphQL operation being executed. */
export type OperationType = 'subscription' | 'query' | 'mutation' | 'teardown';

/** The strategy that is used to request results from network and/or the cache. */
export type RequestPolicy =
  | 'cache-first'
  | 'cache-only'
  | 'network-only'
  | 'cache-and-network';

/** A Graphql query, mutation, or subscription. */
export interface GraphQLRequest {
  /** Unique identifier of the request. */
  key: number;
  query: DocumentNode;
  variables?: object;
}

/** Additional metadata passed to [exchange]{@link Exchange} functions. */
export interface OperationContext {
  [key: string]: any;
  fetchOptions?: RequestInit | (() => RequestInit);
  requestPolicy: RequestPolicy;
  url: string;
}

/** A [query]{@link Query} or [mutation]{@link Mutation} with additional metadata for use during transmission. */
export interface Operation extends GraphQLRequest {
  operationName: OperationType;
  context: OperationContext;
}

/** Resulting data from an [operation]{@link Operation}. */
export interface OperationResult<Data = any> {
  /** The [operation]{@link Operation} which has been executed. */
  operation: Operation;
  /** The data returned from the Graphql server. */
  data?: Data;
  /** Any errors resulting from the operation. */
  error?: CombinedError;
}

/** Input parameters for to an Exchange factory function. */
export interface ExchangeInput {
  forward: ExchangeIO;
  client: Client;
}

/** Function responsible for listening for streamed [operations]{@link Operation}. */
export type Exchange = (input: ExchangeInput) => ExchangeIO;

/** Function responsible for receiving an observable [operation]{@link Operation} and returning a [result]{@link OperationResult}. */
export type ExchangeIO = (ops$: Source<Operation>) => Source<OperationResult>;

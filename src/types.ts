import { Observer, Source, Subject } from 'wonka';
import { ClientState } from './components';
import { Client } from './lib/client';
import { CombinedError } from './lib/error';

export type RequestOperationType =
  | 'subscription'
  | 'query'
  | 'mutation';

export type SignalOperationType =
  | 'teardown';

/** The type of GraphQL operation being executed. */
export type OperationType = RequestOperationType | SignalOperationType;

/** A Graphql query, mutation, or subscription. */
export interface GraphQLRequest {
  query?: string;
  variables?: object;
}

export type Query = GraphQLRequest;
export type Mutation = GraphQLRequest;
export type Subscription = GraphQLRequest;

/** Additional metadata passed to [exchange]{@link Exchange} functions. */
export interface OperationContext {
  [key: string]: any;
  fetchOptions?: RequestInit;
  url: string;
}

/** A [query]{@link Query} or [mutation]{@link Mutation} with additional metadata for use during transmission. */
export interface RequestOperation extends GraphQLRequest {
  /** Unique identifier of the operation. */
  key: string;
  operationName: RequestOperationType;
  context: OperationContext;
}

/** A signal with additional metadata that informs exchanges about specific events during transmission. */
export interface SignalOperation {
  operationName: SignalOperationType;
  context: OperationContext;
}

export type Operation = RequestOperation | SignalOperation;

// Adapted from: https://github.com/graphql/graphql-js/blob/ae5b163/src/execution/execute.js#L105-L114
export interface ExecutionResult {
  errors?: Error[];
  data?: any;
}

/** Resulting data from an [operation]{@link Operation}. */
export interface ExchangeResult {
  /** The [operation]{@link Operation} which has been executed. */
  operation: RequestOperation;
  /** The data returned from the Graphql server. */
  data?: any;
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

/** Function responsible for receiving an observable [operation]{@link Operation} and returning a [result]{@link ExchangeResult}. */
export type ExchangeIO = (ops$: Source<Operation>) => Source<ExchangeResult>;

/** The arguments for the child function of a connector. */
export interface ChildArgs<MutationDeclarations> {
  /** Whether a dependent GraphQL request is currently being fetched. */
  fetching: ClientState<MutationDeclarations>['fetching'];
  /** Any network or GraphQL errors. */
  error: ClientState<MutationDeclarations>['error'];
  /** The data returned from a GraphQL [query]{@link Query} to the server. */
  data: ClientState<MutationDeclarations>['data'];
  /** A collection of functions for executing pre-specified [mutations]{@link Mutation} */
  mutations: ClientState<MutationDeclarations>['mutations'];
  /** Trigger a fetch of the pre-specified [query]{@link Query}. */
  refetch: (noCache?: boolean) => void;
}

import { Source, Subject, Observer } from 'wonka';
import { ClientState } from './components';
import { CombinedError } from './lib';

/** The type of GraphQL operation being executed. */
export type OperationType =
  | 'subscription'
  | 'query'
  | 'mutation'
  | 'teardown';

/** A Graphql query, mutation, or subscription. */
export interface GraphQLRequest {
  query: string;
  variables?: object;
}

export type Query = GraphQLRequest;
export type Mutation = GraphQLRequest;
export type Subscription = GraphQLRequest;

/** Additional metadata passed to [exchange]{@link Exchange} functions. */
export interface OperationContext {
  [key: string]: any;
  fetchOptions?: RequestInit;
  url: ClientOptions['url'];
}

/** A [query]{@link Query} or [mutation]{@link Mutation} with additional metadata for use during transmission. */
export interface Operation extends GraphQLRequest {
  /** Unique identifier of the operation. */
  key: string;
  operationName: OperationType;
  context: OperationContext;
}

// Adapted from: https://github.com/graphql/graphql-js/blob/ae5b163/src/execution/execute.js#L105-L114
export interface ExecutionResult {
  errors?: Error[];
  data?: any;
}

/** Resulting data from an [operation]{@link Operation}. */
export interface ExchangeResult {
  /** The [operation]{@link Operation} which has been executed. */
  operation: Operation;
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
export interface Exchange {
  (input: ExchangeInput): ExchangeIO;
}

/** Function responsible for receiving an observable [operation]{@link Operation} and returning a [result]{@link ExchangeResult}. */
export interface ExchangeIO {
  (ops$: Source<Operation>): Source<ExchangeResult>;
}

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

/** Options for configuring the URQL [client]{@link Client}. */
export interface ClientOptions {
  /** Target endpoint URL such as `https://my-target:8080/graphql`. */
  url: string;
  /** Any additional options to pass to fetch. */
  fetchOptions?: RequestInit | (() => RequestInit);
  /** An ordered array of Exchanges. */
  exchanges?: Exchange[];
}

/** The URQL applicaiton-wide client library. Each execute method starts a GraphQL request and
 returns a stream of results. */
export interface Client {
  new (options: ClientOptions);
  executeQuery: (query: Query) => Source<ExchangeResult>;
  executeMutation: (mutation: Mutation) => Source<ExchangeResult>;
  executeSubscription: (subscription: Subscription) => Source<ExchangeResult>;
  reexecuteOperation: (operation: Operation) => void;
}

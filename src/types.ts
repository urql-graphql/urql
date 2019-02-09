import { Observer, Source, Subject } from 'wonka';
// import { ClientState } from './react';
import { Client } from './lib/client';
import { CombinedError } from './lib/error';

/** The type of GraphQL operation being executed. */
export type OperationType = 'subscription' | 'query' | 'mutation' | 'teardown';

/** A Graphql query, mutation, or subscription. */
export interface GraphQLRequest {
  query: string;
  variables?: object;
}

export type GraphqlQuery = GraphQLRequest;
export type GraphqlMutation = GraphQLRequest;
export type GraphqlSubscription = GraphQLRequest;

/** Additional metadata passed to [exchange]{@link Exchange} functions. */
export interface OperationContext {
  [key: string]: any;
  fetchOptions?: RequestInit;
  url: string;
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
export interface OperationResult {
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
export type Exchange = (input: ExchangeInput) => ExchangeIO;

/** Function responsible for receiving an observable [operation]{@link Operation} and returning a [result]{@link OperationResult}. */
export type ExchangeIO = (ops$: Source<Operation>) => Source<OperationResult>;

// /** The arguments for the child function of a connector. */
// export type ChildArgs<MutationDeclarations> = ClientState<MutationDeclarations>;

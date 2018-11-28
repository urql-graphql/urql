import { Observable, Subject } from 'rxjs';
import { Client, CombinedError } from '../lib';

/** A Graphql query */
export interface Query {
  /** Graphql query string */
  query: string;
  /** Graphql query variables */
  variables?: object;
}

/** A Graphql mutation */
export type Mutation = Query;

/** A Graphql [query]{@link Query} or [mutation]{@link Mutation} accompanied with metadata */
export interface Operation extends Query {
  /** Unique identifier of the operation */
  key: string;
  /** The type of Grapqhql operation being executed */
  operationName: string;
  /** Additional metadata passed to [exchange]{@link Exchange} functions */
  context: Record<string, any>;
}

/** Function responsible for listening for streamed [operations]{@link Operation}. */
export type Exchange = (
  args: {
    /** Function to call the next [exchange]{@link Exchange} in the chain */
    forward: ExchangeIO;
    subject: Subject<Operation>;
  }
) => ExchangeIO;

/** Function responsible for receiving an observable [operation]{@link Operation} and returning a [result]{@link ExchangeResult} */
export type ExchangeIO = (
  ops$: Observable<Operation>
) => Observable<ExchangeResult>;

/** Resulting data from an [operation]{@link Operation} */
export interface ExchangeResult {
  /** The operation which has been executed */
  operation: Operation;
  /** The data returned from the Graphql server */
  data: any;
  /** Any errors resulting from the operation */
  error?: Error;
}

export interface Cache {
  write: (key: string, data: any) => Promise<any>;
  read: (key: string) => Promise<any>;
  invalidate: (key: string) => Promise<any>;
  invalidateAll: () => Promise<any>;
  update: (
    callback: (store: any, key: string, value: any) => void
  ) => Promise<any>;
}

export interface ClientOptions {
  url: string;
  fetchOptions?: any | (() => any);
  exchanges?: Exchange[];
  cacheExchangeIndex: number;
}

export interface CreateInstanceOpts {
  onChange: (data: any) => any;
}

export interface GraphQLError {
  message?: string;
}

export enum ClientEventType {
  RefreshAll = 'RefreshAll',
  CacheKeysInvalidated = 'CacheKeysInvalidated',
}

export interface EventFn {
  (type: ClientEventType.RefreshAll, payload: void): void;
  (type: ClientEventType.CacheKeysInvalidated, payload: string[]): void;
}

// Adapted from: https://github.com/graphql/graphql-js/blob/ae5b163d2e6c124107fa0971f6d838c8a7d29f51/src/execution/execute.js#L105-L114<Paste>
export interface ExecutionResult {
  errors?: Error[];
  data?: any;
}

export interface ExchangeResult {
  operation: Operation; // Add on the original operation
  data: ExecutionResult['data'];
  error?: CombinedError;
}
export interface Operation extends Query {
  key: string;
  operationName: string;
  context: Record<string, any>;
}

export interface Query {
  query: string;
  variables?: object;
}

export interface SubscriptionObserver {
  next: (IExecutionResult) => void;
  error: (Error) => void;
}

export interface Subscription {
  unsubscribe: () => void;
}

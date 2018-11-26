import Observable from 'zen-observable-ts';
import { Client, CombinedError } from '../lib';

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
  fetchOptions?: object | (() => object);
  cache?: Cache;
  initialCache?: object;
  transformExchange?: (exchange: Exchange, client: Client) => Exchange;
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
  data?: object;
}

export interface ExchangeResult {
  operation: Operation; // Add on the original operation
  data: ExecutionResult['data'];
  error?: CombinedError;
}

export type Exchange = (operation: Operation) => Observable<ExchangeResult>;

export interface Mutation {
  [key: string]: Query;
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

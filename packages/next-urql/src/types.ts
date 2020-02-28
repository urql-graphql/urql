import { NextPageContext } from 'next';
import { ClientOptions, Exchange, Client } from 'urql';
import { AppContext } from 'next/app';

export type NextUrqlClientOptions = Omit<
  ClientOptions,
  'exchanges' | 'suspense'
>;

export type NextUrqlClientConfig =
  | NextUrqlClientOptions
  | ((ctx?: NextPageContext) => NextUrqlClientOptions);

export type MergeExchanges = (ssrExchange: SSRExchange) => Exchange[];

export interface NextUrqlPageContext extends NextPageContext {
  urqlClient: Client;
}

export interface NextUrqlAppContext extends AppContext {
  urqlClient: Client;
}

export type NextUrqlContext = NextUrqlPageContext | NextUrqlAppContext;

export interface WithUrqlState {
  urqlState?: SSRData;
}

export interface WithUrqlClient {
  urqlClient: Client;
}

export interface WithUrqlProps extends WithUrqlClient, WithUrqlState {
  [key: string]: any;
}

export interface SerializedResult {
  data?: any;
  error?: {
    networkError?: string;
    graphQLErrors: string[];
  };
}

export interface SSRData {
  [key: string]: SerializedResult;
}

export interface SSRExchange extends Exchange {
  /** Rehydrates cached data */
  restoreData(data: SSRData): void;
  /** Extracts cached data */
  extractData(): SSRData;
}
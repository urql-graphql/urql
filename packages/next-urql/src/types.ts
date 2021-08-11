import { GraphQLError } from 'graphql';
import { ClientOptions, Exchange, Client } from 'urql';
import { NextPageContext } from 'next';
import { AppContext } from 'next/app';

export interface NextUrqlPageContext extends NextPageContext {
  urqlClient: Client;
}

export interface NextUrqlAppContext extends AppContext {
  urqlClient: Client;
}

export type NextUrqlContext = NextUrqlPageContext | NextUrqlAppContext;

export type NextUrqlClientConfig = (
  ssrExchange: SSRExchange,
  ctx?: NextPageContext
) => ClientOptions;

export interface WithUrqlState {
  urqlState?: SSRData;
}

export interface WithUrqlClient {
  urqlClient?: Client;
}

export interface WithUrqlProps extends WithUrqlClient, WithUrqlState {
  resetUrqlClient?: () => void;
  pageProps: any;
  [key: string]: any;
}

export interface SerializedResult {
  data?: any;
  error?: {
    graphQLErrors: Array<Partial<GraphQLError> | string>;
    networkError?: string;
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

export interface WithUrqlClientOptions {
  ssr?: boolean;
  neverSuspend?: boolean;
  staleWhileRevalidate?: boolean;
}

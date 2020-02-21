import { NextPageContext } from 'next';
import { ClientOptions, Exchange, Client } from 'urql';
import { SSRExchange, SSRData } from 'urql/dist/types/exchanges/ssr';
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

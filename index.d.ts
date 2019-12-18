import React from 'react';
import { NextComponentClass, NextContext, NextFC } from 'next';
import { Client, ClientOptions, Exchange } from 'urql';
import { SSRExchange, SSRData } from 'urql/dist/types/exchanges/ssr';

type NextUrqlClientOptions = Omit<ClientOptions, 'exchanges' | 'suspense'>;

interface WithUrqlClient {
  urqlClient: Client;
}

interface WithUrqlInitialProps {
  urqlState: SSRData;
  clientOptions: NextUrqlClientOptions;
}

export interface NextContextWithAppTree extends NextContext {
  AppTree: React.ComponentType<any>;
}

type NextUrqlClientConfig =
  | NextUrqlClientOptions
  | ((ctx: NextContext<any, any>) => NextUrqlClientOptions);

declare const withUrqlClient: <T = any, IP = any>(
  clientOptions: NextUrqlClientConfig,
  mergeExchanges?: (ssrEx: SSRExchange) => Exchange[],
) => (
  App:
    | NextComponentClass<T & IP & WithUrqlClient, T & IP & WithUrqlClient>
    | NextFC<T & IP & WithUrqlClient, T & IP & WithUrqlClient>,
) => NextFC<
  T & IP & WithUrqlClient & WithUrqlInitialProps,
  IP | (IP & WithUrqlInitialProps),
  NextContextWithAppTree
>;

import React from 'react';
import { NextComponentClass, NextContext, NextFC } from 'next';
import { Client, ClientOptions, Exchange } from 'urql';
import { SSRExchange, SSRData } from 'urql/dist/types/exchanges/ssr';

type NextUrqlClientOptions = Omit<ClientOptions, 'exchanges' | 'suspense'>;

interface WithUrqlClient {
  urqlClient?: Client;
}

interface WithUrqlInitialProps {
  urqlState: SSRData;
  clientOptions: NextUrqlClientOptions;
}

interface PageProps {
  pageProps?: WithUrqlClient;
}

export interface NextContextWithAppTree extends NextContext {
  AppTree: React.ComponentType<any>;
  urqlClient: Client;
}

type NextUrqlClientConfig =
  | NextUrqlClientOptions
  | ((ctx: NextContext<any, any>) => NextUrqlClientOptions);

declare const withUrqlClient: <T = any, IP = any>(
  clientOptions: NextUrqlClientConfig,
  mergeExchanges?: (ssrEx: SSRExchange) => Exchange[],
) => (
  Page:
    | NextComponentClass<T & IP & WithUrqlClient, IP>
    | NextFC<T & IP & WithUrqlClient, IP>,
) => NextFC<
  T & IP & WithUrqlClient & WithUrqlInitialProps & PageProps,
  IP | (IP & WithUrqlInitialProps),
  NextContextWithAppTree
>;

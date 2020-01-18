import React from 'react';
import { NextPageContext, NextPage, NextComponentType } from 'next';
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

export interface NextUrqlContext extends NextPageContext {
  urqlClient: Client;
}

type NextUrqlClientConfig =
  | NextUrqlClientOptions
  | ((ctx: NextPageContext) => NextUrqlClientOptions);

declare const withUrqlClient: <T = any, IP = any>(
  clientConfig: NextUrqlClientConfig,
  mergeExchanges?: (ssrEx: SSRExchange) => Exchange[],
) => (
  Page: NextPage<T & IP & WithUrqlClient, IP>,
) => NextComponentType<
  NextUrqlContext,
  IP | (IP & WithUrqlInitialProps),
  T & IP & WithUrqlClient & WithUrqlInitialProps & PageProps
>;

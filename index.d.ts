import React from 'react';
import { NextComponentClass, NextContext, NextFC } from 'next';
import { Client, ClientOptions, Exchange } from 'urql';
import { SSRExchange, SSRData } from 'urql/dist/types/exchanges/ssr';

interface WithUrqlClient {
  urqlClient: Client;
}

interface WithUrqlState {
  urqlState: SSRData;
}

interface NextContextWithAppTree extends NextContext {
  AppTree: React.ComponentType<any>;
}

type NextUrqlClientOptions =
  | Omit<ClientOptions, 'exchanges' | 'suspense'>
  | ((
      ctx: NextContext<any, any>,
    ) => Omit<ClientOptions, 'exchanges' | 'suspense'>);

declare const withUrqlClient: <T>(
  clientOptions: NextUrqlClientOptions,
  mergeExchanges?: (ssrEx: SSRExchange) => Exchange[],
) => (
  App:
    | NextComponentClass<
        T & WithUrqlClient,
        T & WithUrqlClient,
        NextContext<Record<string, string | string[] | undefined>, {}>
      >
    | NextFC<
        T & WithUrqlClient,
        T & WithUrqlClient,
        NextContext<Record<string, string | string[] | undefined>, {}>
      >,
) => NextFC<
  T & WithUrqlClient & WithUrqlState,
  T & WithUrqlState,
  NextContextWithAppTree
>;

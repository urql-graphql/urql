import React from 'react';
import { NextComponentClass, NextContext } from 'next';
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

declare const withUrqlClient: <T extends {}>(
  clientOptions: Pick<
    ClientOptions,
    'fetch' | 'url' | 'fetchOptions' | 'requestPolicy'
  >,
  mergeExchanges?: (ssrEx: SSRExchange) => Exchange[],
) => (
  App:
    | NextComponentClass<
        T & WithUrqlClient,
        T & WithUrqlClient,
        NextContext<Record<string, string | string[] | undefined>, {}>
      >
    | import('next').NextFunctionComponent<
        T & WithUrqlClient,
        T & WithUrqlClient,
        NextContext<Record<string, string | string[] | undefined>, {}>
      >,
) => import('next').NextFunctionComponent<
  T & WithUrqlClient & WithUrqlState,
  T & WithUrqlState,
  NextContextWithAppTree
>;

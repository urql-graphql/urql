import React from 'react';
import { NextComponentClass, NextFC, NextContext } from 'next';
import ssrPrepass from 'react-ssr-prepass';
import {
  Provider,
  Client,
  ClientOptions,
  dedupExchange,
  cacheExchange,
  fetchExchange,
  Exchange,
} from 'urql';
import { SSRExchange, SSRData } from 'urql/dist/types/exchanges/ssr';

import { initUrqlClient } from './init-urql-client';

interface WithUrqlClient {
  urqlClient: Client;
}

interface WithUrqlState {
  urqlState: SSRData;
}

export interface NextContextWithAppTree extends NextContext {
  AppTree: React.ComponentType<any>;
}

type NextUrqlClientOptions =
  | Omit<ClientOptions, 'exchanges' | 'suspense'>
  | ((
      ctx: NextContext<any, any>,
    ) => Omit<ClientOptions, 'exchanges' | 'suspense'>);

const withUrqlClient = <T extends {}>(
  clientOptions: NextUrqlClientOptions,
  mergeExchanges: (ssrEx: SSRExchange) => Exchange[] = ssrEx => [
    dedupExchange,
    cacheExchange,
    ssrEx,
    fetchExchange,
  ],
) => (
  App: NextComponentClass<T & WithUrqlClient> | NextFC<T & WithUrqlClient>,
) => {
  const withUrql: NextFC<
    T & WithUrqlClient & WithUrqlState & { ctx: NextContextWithAppTree },
    T & WithUrqlState,
    NextContextWithAppTree
  > = props => {
    const opts =
      typeof clientOptions === 'function'
        ? clientOptions(props.ctx)
        : clientOptions;

    const urqlClient = React.useMemo(
      () =>
        props.urqlClient ||
        initUrqlClient(opts, mergeExchanges, props.urqlState)[0],
      [],
    );

    return (
      <Provider value={urqlClient}>
        <App {...props} urqlClient={urqlClient} />
      </Provider>
    );
  };

  withUrql.getInitialProps = async (ctx: NextContextWithAppTree) => {
    const { AppTree } = ctx;

    // Run the wrapped component's getInitialProps function.
    let appProps = {};
    if (App.getInitialProps) {
      appProps = await App.getInitialProps(ctx);
    }

    /**
     * Check the window object to determine whether we are on the server.
     * getInitialProps is universal, but we only want to run suspense on the server.
     */
    const isBrowser = typeof window !== 'undefined';
    if (isBrowser) {
      return appProps as T & WithUrqlState;
    }

    const opts =
      typeof clientOptions === 'function' ? clientOptions(ctx) : clientOptions;
    const [urqlClient, ssrCache] = initUrqlClient(opts);

    /**
     * Run the prepass step on AppTree.
     * This will run all urql queries on the server.
     */
    await ssrPrepass(
      <AppTree
        pageProps={{
          ...appProps,
          urqlClient: urqlClient as Client,
        }}
      />,
    );

    // Extract the SSR query data from urql's SSR cache.
    const urqlState = ssrCache && ssrCache.extractData();

    return {
      ...appProps,
      urqlState,
      ctx,
    } as T & WithUrqlState & { ctx: NextContextWithAppTree };
  };

  return withUrql;
};

export default withUrqlClient;

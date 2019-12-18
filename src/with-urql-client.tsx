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

function withUrqlClient<T = any, IP = any>(
  clientConfig: NextUrqlClientConfig,
  mergeExchanges: (ssrEx: SSRExchange) => Exchange[] = ssrEx => [
    dedupExchange,
    cacheExchange,
    ssrEx,
    fetchExchange,
  ],
) {
  return (
    App:
      | NextComponentClass<T & IP & WithUrqlClient, IP>
      | NextFC<T & IP & WithUrqlClient, IP>,
  ) => {
    const withUrql: NextFC<
      T & IP & WithUrqlClient & WithUrqlInitialProps,
      IP | (IP & WithUrqlInitialProps),
      NextContextWithAppTree
    > = ({ urqlClient, urqlState, clientOptions, ...rest }) => {
      /**
       * The React Hooks ESLint plugin will not interpret withUrql as a React component
       * due to the Next.FC annotation. Ignore the warning about not using useMemo.
       */
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const client = React.useMemo(
        () =>
          urqlClient ||
          initUrqlClient(clientOptions, mergeExchanges, urqlState)[0],
        [urqlClient, clientOptions, urqlState],
      );

      return (
        <Provider value={client}>
          <App urqlClient={client} {...(rest as T & IP)} />
        </Provider>
      );
    };

    withUrql.getInitialProps = async (ctx: NextContextWithAppTree) => {
      const { AppTree } = ctx;

      // Run the wrapped component's getInitialProps function.
      let appProps = {} as IP;
      if (App.getInitialProps) {
        appProps = await App.getInitialProps(ctx);
      }

      /**
       * Check the window object to determine whether we are on the server.
       * getInitialProps is universal, but we only want to run suspense on the server.
       */
      const isBrowser = typeof window !== 'undefined';
      if (isBrowser) {
        return appProps;
      }

      const opts =
        typeof clientConfig === 'function' ? clientConfig(ctx) : clientConfig;
      const [urqlClient, ssrCache] = initUrqlClient(opts);

      /**
       * Run the prepass step on AppTree.
       * This will run all urql queries on the server.
       */
      await ssrPrepass(
        <AppTree
          pageProps={{
            ...appProps,
            urqlClient,
          }}
        />,
      );

      // Extract the SSR query data from urql's SSR cache.
      const urqlState = ssrCache && ssrCache.extractData();

      return {
        ...appProps,
        urqlState,
        clientOptions: opts,
      };
    };

    return withUrql;
  };
}

export default withUrqlClient;

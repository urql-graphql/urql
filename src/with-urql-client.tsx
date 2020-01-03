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
    Page:
      | NextComponentClass<T & IP & WithUrqlClient, IP>
      | NextFC<T & IP & WithUrqlClient, IP>,
  ) => {
    const withUrql: NextFC<
      T & IP & WithUrqlClient & WithUrqlInitialProps & PageProps,
      IP | (IP & WithUrqlInitialProps),
      NextContextWithAppTree
    > = ({ urqlClient, urqlState, clientOptions, pageProps, ...rest }) => {
      /**
       * The React Hooks ESLint plugin will not interpret withUrql as a React component
       * due to the Next.FC annotation. Ignore the warning about not using useMemo.
       */
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const client = React.useMemo(
        () =>
          urqlClient ||
          (pageProps && pageProps.urqlClient) ||
          initUrqlClient(clientOptions, mergeExchanges, urqlState)[0],
        [urqlClient, pageProps, clientOptions, urqlState],
      ) as Client;

      return (
        <Provider value={client}>
          <Page urqlClient={client} {...(rest as T & IP)} />
        </Provider>
      );
    };

    withUrql.getInitialProps = async (ctx: NextContextWithAppTree) => {
      const { AppTree } = ctx;

      const opts =
        typeof clientConfig === 'function' ? clientConfig(ctx) : clientConfig;
      const [urqlClient, ssrCache] = initUrqlClient(opts);

      if (urqlClient) {
        ctx.urqlClient = urqlClient;
      }

      // Run the wrapped component's getInitialProps function.
      let pageProps = {} as IP;
      if (Page.getInitialProps) {
        pageProps = await Page.getInitialProps(ctx);
      }

      /**
       * Check the window object to determine whether we are on the server.
       * getInitialProps is universal, but we only want to run suspense on the server.
       */
      const isBrowser = typeof window !== 'undefined';
      if (isBrowser) {
        return pageProps;
      }

      /**
       * Run the prepass step on AppTree.
       * This will run all urql queries on the server.
       */
      await ssrPrepass(
        <AppTree
          pageProps={{
            ...pageProps,
            urqlClient,
          }}
        />,
      );

      // Extract the SSR query data from urql's SSR cache.
      const urqlState = ssrCache && ssrCache.extractData();

      return {
        ...pageProps,
        urqlState,
        clientOptions: opts,
      };
    };

    return withUrql;
  };
}

export default withUrqlClient;

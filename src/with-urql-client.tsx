import React from 'react';
import { NextPage, NextPageContext, NextComponentType } from 'next';
import { AppContext } from 'next/app';
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

export type NextUrqlClientOptions = Omit<
  ClientOptions,
  'exchanges' | 'suspense'
>;

interface WithUrqlClient {
  urqlClient?: Client;
}

interface WithUrqlInitialProps {
  urqlState: SSRData;
}

interface PageProps {
  pageProps?: WithUrqlClient;
}

export interface NextUrqlContext extends NextPageContext {
  urqlClient: Client;
}

type NextUrqlClientConfig =
  | NextUrqlClientOptions
  | ((ctx?: NextPageContext) => NextUrqlClientOptions);

function withUrqlClient<T = any, IP = any>(
  clientConfig: NextUrqlClientConfig,
  mergeExchanges: (ssrEx: SSRExchange) => Exchange[] = ssrEx => [
    dedupExchange,
    cacheExchange,
    ssrEx,
    fetchExchange,
  ],
) {
  return (Page: NextPage<T & IP & WithUrqlClient, IP>) => {
    const withUrql: NextComponentType<
      NextUrqlContext,
      IP | (IP & WithUrqlInitialProps),
      T & IP & WithUrqlClient & WithUrqlInitialProps & PageProps
    > = ({ urqlClient, urqlState, pageProps, ...rest }) => {
      // The React Hooks ESLint plugin will not interpret withUrql as a React component
      // due to the NextComponentType annotation. Ignore the warning about not using useMemo.

      // eslint-disable-next-line react-hooks/rules-of-hooks
      const client = React.useMemo(() => {
        const clientOptions =
          typeof clientConfig === 'function' ? clientConfig() : clientConfig;

        return (
          urqlClient ||
          pageProps?.urqlClient ||
          initUrqlClient(clientOptions, mergeExchanges, urqlState)[0]
        );
      }, [urqlClient, pageProps, urqlState]) as Client;

      return (
        <Provider value={client}>
          <Page urqlClient={client} {...(rest as T & IP)} />
        </Provider>
      );
    };

    // Set the displayName to indicate use of withUrqlClient.
    const displayName = Page.displayName || Page.name || 'Component';
    withUrql.displayName = `withUrqlClient(${displayName})`;

    withUrql.getInitialProps = async (ctx: NextPageContext | AppContext) => {
      const { AppTree } = ctx;

      const appCtx = (ctx as AppContext).ctx;
      const isApp = !!appCtx;

      const opts =
        typeof clientConfig === 'function'
          ? clientConfig(isApp ? appCtx : (ctx as NextPageContext))
          : clientConfig;
      const [urqlClient, ssrCache] = initUrqlClient(opts, mergeExchanges);

      if (urqlClient) {
        (ctx as NextUrqlContext).urqlClient = urqlClient;
      }

      // Run the wrapped component's getInitialProps function.
      let pageProps = {} as IP;
      if (Page.getInitialProps) {
        pageProps = await Page.getInitialProps(ctx as NextUrqlContext);
      }

      // Check the window object to determine whether or not we are on the server.
      // getInitialProps runs on the server for initial render, and on the client for navigation.
      // We only want to run the prepass step on the server.
      if (typeof window !== 'undefined') {
        return pageProps;
      }

      // Run the prepass step on AppTree. This will run all urql queries on the server.
      await ssrPrepass(
        <AppTree
          pageProps={{
            ...pageProps,
            urqlClient,
          }}
        />,
      );

      // Extract the query data from urql's SSR cache.
      const urqlState = ssrCache?.extractData();

      return {
        ...pageProps,
        urqlState,
      };
    };

    return withUrql;
  };
}

export default withUrqlClient;

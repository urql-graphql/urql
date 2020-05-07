import React from 'react';
import { NextPage, NextPageContext } from 'next';
import NextApp, { AppContext } from 'next/app';
import ssrPrepass from 'react-ssr-prepass';
import {
  Provider,
  ssrExchange,
  dedupExchange,
  cacheExchange,
  fetchExchange,
} from 'urql';

import { initUrqlClient } from './init-urql-client';
import { NextUrqlClientConfig, NextUrqlContext, WithUrqlProps } from './types';

function getDisplayName(Component: React.ComponentType<any>) {
  return Component.displayName || Component.name || 'Component';
}

export function withUrqlClient(getClientConfig: NextUrqlClientConfig, ssr?: boolean) {
  return (AppOrPage: NextPage<any> | typeof NextApp) => {
    const withUrql = ({ urqlClient, urqlState, ...rest }: WithUrqlProps) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const client = React.useMemo(() => {
        if (urqlClient) {
          return urqlClient;
        }

        const ssr = ssrExchange({ initialState: urqlState });
        const clientConfig = getClientConfig(ssr);
        if (!clientConfig.exchanges) {
          // When the user does not provide exchanges we make the default assumption.
          clientConfig.exchanges = [
            dedupExchange,
            cacheExchange,
            ssr,
            fetchExchange,
          ];
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return initUrqlClient(clientConfig)!;
      }, [urqlClient, urqlState]);

      return (
        <Provider value={client}>
          <AppOrPage urqlClient={client} {...rest} />
        </Provider>
      );
    };

    // Set the displayName to indicate use of withUrqlClient.
    withUrql.displayName = `withUrqlClient(${getDisplayName(AppOrPage)})`;

    if (AppOrPage.getInitialProps || ssr) {
      withUrql.getInitialProps = async (appOrPageCtx: NextUrqlContext) => {
        const { AppTree } = appOrPageCtx;

        // Determine if we are wrapping an App component or a Page component.
        const isApp = !!(appOrPageCtx as AppContext).Component;
        const ctx = isApp
          ? (appOrPageCtx as AppContext).ctx
          : (appOrPageCtx as NextPageContext);

        const ssrCache = ssrExchange({ initialState: undefined });
        const clientConfig = getClientConfig(ssrCache, ctx);
        if (!clientConfig.exchanges) {
          // When the user does not provide exchanges we make the default assumption.
          clientConfig.exchanges = [
            dedupExchange,
            cacheExchange,
            ssrCache,
            fetchExchange,
          ];
        }
        const urqlClient = initUrqlClient(clientConfig);

        if (urqlClient) {
          (ctx as NextUrqlContext).urqlClient = urqlClient;
        }

        // Run the wrapped component's getInitialProps function.
        let pageProps = {} as any;
        if (AppOrPage.getInitialProps) {
          pageProps = await AppOrPage.getInitialProps(appOrPageCtx as any);
        }

        // Check the window object to determine whether or not we are on the server.
        // getInitialProps runs on the server for initial render, and on the client for navigation.
        // We only want to run the prepass step on the server.
        if (typeof window !== 'undefined') {
          return { ...pageProps, urqlClient };
        }

        const props = { ...pageProps, urqlClient };
        const appTreeProps = isApp ? props : { pageProps: props };

        // Run the prepass step on AppTree. This will run all urql queries on the server.
        await ssrPrepass(<AppTree {...appTreeProps} />);

        // Serialize the urqlClient to null on the client-side.
        // This ensures we don't share client and server instances of the urqlClient.
        (urqlClient as any).toJSON = () => {
          return null;
        };

        // Check the window object to determine whether or not we are on the server.
        // getInitialProps runs on the server for initial render, and on the client for navigation.
        // We only want to run the prepass step on the server.
        if (typeof window !== 'undefined') {
          return { ...pageProps, urqlClient };
        }

        await ssrPrepass(<AppTree {...appTreeProps} />);

        // Serialize the urqlClient to null on the client-side.
        // This ensures we don't share client and server instances of the urqlClient.
        (urqlClient as any).toJSON = () => {
          return null;
        };

        return {
          ...pageProps,
          urqlState: ssrCache ? ssrCache.extractData() : undefined,
          urqlClient,
        };
      };
    }

    return withUrql;
  };
}

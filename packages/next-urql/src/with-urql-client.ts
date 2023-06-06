import type { ReactNode, ReactElement } from 'react';
import * as React from 'react';

import {
  Provider,
  SSRExchange,
  ssrExchange,
  cacheExchange,
  fetchExchange,
} from 'urql';

import ssrPrepass from 'react-ssr-prepass';
import { NextComponentType, NextPage, NextPageContext } from 'next';
import NextApp, { AppContext } from 'next/app';

import { initUrqlClient, resetClient } from './init-urql-client';

import {
  NextUrqlClientConfig,
  NextUrqlContext,
  WithUrqlProps,
  WithUrqlClientOptions,
} from './types';

let ssr: SSRExchange;
type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

/** Creates a wrapper for Next.js Page, App, or Document components that rehydrates `urql` state.
 *
 * @param getClientConfig - function used to create the {@link Client}
 * @param options - optional {@link WithUrqlClientOptions} configuration options
 * @returns a higher-order component function, which you can pass a Next.js page or app component.
 *
 * @remarks
 * Used to wrap a Next.js page or app component. It will create a {@link Client} and passes
 * it on to the child component and adds a React Provider for it.
 *
 * It will restore any page’s `pageProps.urqlState` with the {@link SSRExchange} and also
 * supports doing this automatically when the {@link WithUrqlClientOptions.ssr} option
 * is enabled.
 *
 * If you don’t define the above option, you will have to write `getServerSideProps` or
 * `getStaticProps` methods on your component manually.
 *
 * @see {@link https://urql.dev/goto/docs/advanced/server-side-rendering/#nextjs} for more documentation.
 *
 * @example
 * ```ts
 * import { cacheExchange, fetchExchange } from '@urql/core';
 * import { withUrqlClient } from 'next-urql';
 *
 * const WrappedPage = withUrqlClient(
 *   (ssrExchange) => ({
 *     url: 'https://YOUR_API',
 *     exchanges: [cacheExchange, ssrExchange, fetchExchange],
 *   }),
 *   { ssr: true },
 * )(Page);
 * ```
 */
export function withUrqlClient(
  getClientConfig: NextUrqlClientConfig,
  options?: WithUrqlClientOptions
) {
  if (!options) options = {};

  return <C extends NextPage<any> | typeof NextApp>(
    AppOrPage: C
  ): NextComponentType<NextUrqlContext, {}, WithUrqlProps> => {
    const shouldEnableSuspense = Boolean(
      (AppOrPage.getInitialProps || options!.ssr) && !options!.neverSuspend
    );

    const WithUrql = ({
      pageProps,
      urqlClient,
      urqlState,
      ...rest
    }: WithUrqlProps) => {
      const [version, forceUpdate] = React.useReducer(prev => prev + 1, 0);
      const urqlServerState = (pageProps && pageProps.urqlState) || urqlState;

      const client = React.useMemo(() => {
        if (urqlClient && !version) {
          return urqlClient;
        }

        if (!ssr || typeof window === 'undefined') {
          // We want to force the cache to hydrate, we do this by setting the isClient flag to true
          ssr = ssrExchange({
            initialState: urqlServerState,
            isClient: true,
            staleWhileRevalidate:
              typeof window !== 'undefined'
                ? options!.staleWhileRevalidate
                : undefined,
          });
        } else if (!version) {
          ssr.restoreData(urqlServerState);
        }

        const clientConfig = getClientConfig(ssr);
        if (!clientConfig.exchanges) {
          // When the user does not provide exchanges we make the default assumption.
          clientConfig.exchanges = [cacheExchange, ssr, fetchExchange];
        }

        return initUrqlClient(clientConfig, shouldEnableSuspense)!;
      }, [urqlClient, urqlServerState, version]);

      const resetUrqlClient = React.useCallback(() => {
        resetClient();
        ssr = ssrExchange({ initialState: undefined });
        forceUpdate();
      }, []);

      return React.createElement(
        Provider,
        { value: client },
        React.createElement(AppOrPage, {
          ...rest,
          pageProps,
          urqlClient: client,
          resetUrqlClient,
        })
      );
    };

    // Set the displayName to indicate use of withUrqlClient.
    const displayName =
      (AppOrPage as any).displayName || AppOrPage.name || 'Component';
    WithUrql.displayName = `withUrqlClient(${displayName})`;

    if ((AppOrPage as NextPageWithLayout).getLayout) {
      WithUrql.getLayout = (AppOrPage as NextPageWithLayout).getLayout;
    }

    if (AppOrPage.getInitialProps || options!.ssr) {
      WithUrql.getInitialProps = async (appOrPageCtx: NextUrqlContext) => {
        const AppTree = appOrPageCtx.AppTree!;

        // Determine if we are wrapping an App component or a Page component.
        const isApp = !!(appOrPageCtx as AppContext).Component;
        const ctx = isApp
          ? (appOrPageCtx as AppContext).ctx
          : (appOrPageCtx as NextPageContext);

        const ssrCache = ssrExchange({ initialState: undefined });
        const clientConfig = getClientConfig(ssrCache, ctx);
        if (!clientConfig.exchanges) {
          // When the user does not provide exchanges we make the default assumption.
          clientConfig.exchanges = [cacheExchange, ssrCache, fetchExchange];
        }

        const urqlClient = initUrqlClient(clientConfig, !options!.neverSuspend);

        if (urqlClient) {
          (ctx as NextUrqlContext).urqlClient = urqlClient;
        }

        // Run the wrapped component's getInitialProps function.
        let pageProps = {} as any;
        if (AppOrPage.getInitialProps) {
          pageProps = await AppOrPage.getInitialProps(appOrPageCtx as any);
          if (ctx.res && (ctx.res.writableEnded || ctx.res.finished)) {
            return { ...pageProps, urqlClient };
          }
        }

        // Check the window object to determine whether or not we are on the server.
        // getInitialProps runs on the server for initial render, and on the client for navigation.
        // We only want to run the prepass step on the server.
        if (typeof window !== 'undefined') {
          return { ...pageProps, urqlClient };
        }

        const props = { ...pageProps, urqlClient };
        const appTreeProps = isApp
          ? { pageProps: {}, ...props }
          : { pageProps: props };

        // Run the prepass step on AppTree. This will run all urql queries on the server.
        if (!options!.neverSuspend) {
          await ssrPrepass(React.createElement(AppTree, appTreeProps));
        }

        return {
          ...pageProps,
          urqlState: ssrCache ? ssrCache.extractData() : undefined,
          urqlClient,
        };
      };
    }

    return WithUrql;
  };
}

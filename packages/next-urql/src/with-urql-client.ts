import {
  createElement,
  useCallback,
  useReducer,
  useMemo,
  ReactNode,
  ReactElement,
} from 'react';
import ssrPrepass from 'react-ssr-prepass';
import { NextComponentType, NextPage, NextPageContext } from 'next';
import NextApp, { AppContext } from 'next/app';

import {
  Provider,
  ssrExchange,
  dedupExchange,
  cacheExchange,
  fetchExchange,
} from 'urql';

import { initUrqlClient } from './init-urql-client';

import {
  NextUrqlClientConfig,
  NextUrqlContext,
  WithUrqlProps,
  WithUrqlClientOptions,
  SSRExchange,
} from './types';

let ssr: SSRExchange;
type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

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
      const [version, forceUpdate] = useReducer(prev => prev + 1, 0);
      const urqlServerState = (pageProps && pageProps.urqlState) || urqlState;

      const client = useMemo(() => {
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
          clientConfig.exchanges = [
            dedupExchange,
            cacheExchange,
            ssr,
            fetchExchange,
          ];
        }

        return initUrqlClient(clientConfig, shouldEnableSuspense)!;
      }, [urqlClient, urqlServerState, version]);

      const resetUrqlClient = useCallback(() => {
        ssr = ssrExchange({ initialState: undefined });
        forceUpdate();
      }, []);

      return createElement(
        Provider,
        { value: client },
        createElement(AppOrPage, {
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
          clientConfig.exchanges = [
            dedupExchange,
            cacheExchange,
            ssrCache,
            fetchExchange,
          ];
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
        const appTreeProps = isApp ? props : { pageProps: props };

        // Run the prepass step on AppTree. This will run all urql queries on the server.
        if (!options!.neverSuspend) {
          await ssrPrepass(createElement(AppTree, appTreeProps));
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

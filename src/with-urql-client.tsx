import React from 'react';
import { Provider, Client } from 'urql';

import ssrPrepass from 'react-ssr-prepass';
import initUrqlClient from './init-urql-client';
import { NextContext, NextComponentClass } from 'next';
import { SSRData } from 'urql/dist/types/exchanges/ssr';

interface Ctx extends NextContext {
  AppTree: React.ComponentType<{
    pageProps: object & { urqlClient: Client };
  }>;
}

interface WithUrqlProps {
  urqlClient: Client;
  urqlState: SSRData;
}

const withUrqlClient = (App: NextComponentClass) => {
  const withUrql = <P extends WithUrqlProps>(props: P) => {
    const urqlClient = React.useMemo(
      () => props.urqlClient || initUrqlClient(props.urqlState)[0],
      [],
    );
    return (
      <Provider value={urqlClient}>
        <App {...props} urqlClient={urqlClient} />
      </Provider>
    );
  };

  withUrql.getInitialProps = async (ctx: Ctx) => {
    const { AppTree } = ctx;
    // Run the wrapped component's getInitialProps function
    let appProps = {};
    if (App.getInitialProps) appProps = await App.getInitialProps(ctx);

    // getInitialProps is universal, but we only want
    // to run server-side rendered suspense on the server
    const isBrowser = typeof window !== 'undefined';
    if (isBrowser) return appProps;

    const [urqlClient, ssrCache] = initUrqlClient();

    // Run suspense and hence all urql queries
    await ssrPrepass(
      <AppTree
        pageProps={{
          ...appProps,
          urqlClient: urqlClient as Client,
        }}
      />,
    );

    // Extract query data from the urql store
    // Extract the SSR query data from urql's SSR cache
    const urqlState = ssrCache && ssrCache.extractData();

    return {
      ...appProps,
      urqlState,
    };
  };

  return withUrql;
};

export default withUrqlClient;

'use client';

import React from 'react';
import { Provider, SSRExchange, Client } from 'urql';
import { DataHydrationContextProvider } from './DataHydrationContext';

export const ssrContext = React.createContext<SSRExchange | undefined>(
  undefined
);

export function UrqlProvider({
  children,
  ssr,
  client,
}: React.PropsWithChildren<{ ssr: SSRExchange; client: Client }>) {
  return (
    <Provider value={client}>
      <ssrContext.Provider value={ssr}>
        <DataHydrationContextProvider>{children}</DataHydrationContextProvider>
      </ssrContext.Provider>
    </Provider>
  );
}

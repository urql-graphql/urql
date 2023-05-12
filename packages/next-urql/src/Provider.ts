'use client';

import React from 'react';
import { Provider, SSRExchange, Client } from 'urql';
import { DataHydrationContextProvider } from './DataHydrationContext';

export const SSRContext = React.createContext<SSRExchange | undefined>(
  undefined
);

export function UrqlProvider({
  children,
  ssr,
  client,
}: React.PropsWithChildren<{ ssr: SSRExchange; client: Client }>) {
  return React.createElement(
    Provider,
    { value: client },
    React.createElement(
      SSRContext.Provider,
      { value: ssr },
      React.createElement(DataHydrationContextProvider, {}, children)
    )
  );
}

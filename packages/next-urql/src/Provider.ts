'use client';

import * as React from 'react';
import type { SSRExchange, Client } from 'urql';
import { Provider } from 'urql';
import { DataHydrationContextProvider } from './DataHydrationContext';

export const SSRContext = React.createContext<SSRExchange | undefined>(
  undefined
);

const SuspenseWarning = () => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      'urql suspended but there was no boundary to catch it, add a <Suspense> component under your urql Provider.'
    );
  }
  return null;
};

/** Provider for `@urql/next` during non-rsc interactions.
 *
 * @remarks
 * `Provider` accepts a {@link Client} and provides it to all GraphQL hooks, it
 * also accepts an {@link SSRExchange} to distribute data when re-hydrating
 * on the client.
 *
 * @example
 * ```tsx
 * import {
 *  UrqlProvider,
 *  ssrExchange,
 *  cacheExchange,
 *  fetchExchange,
 *  createClient,
 * } from '@urql/next';
 *
 * const ssr = ssrExchange();
 * const client = createClient({
 *   url: 'https://trygql.formidable.dev/graphql/basic-pokedex',
 *   exchanges: [cacheExchange, ssr, fetchExchange],
 *   suspense: true,
 * });
 *
 * export default function Layout({ children }: React.PropsWithChildren) {
 *   return (
 *     <UrqlProvider client={client} ssr={ssr}>
 *      {children}
 *     </UrqlProvider>
 *   );
 * }
 *
 * ```
 */
export function UrqlProvider({
  children,
  ssr,
  client,
  nonce,
}: React.PropsWithChildren<{
  ssr: SSRExchange;
  client: Client;
  nonce?: string;
}>) {
  return React.createElement(
    Provider,
    { value: client },
    React.createElement(
      SSRContext.Provider,
      { value: ssr },
      React.createElement(
        DataHydrationContextProvider,
        { nonce },
        React.createElement(
          React.Suspense,
          { fallback: React.createElement(SuspenseWarning) },
          children
        )
      )
    )
  );
}

'use client';

import React from 'react';
import { Provider, SSRExchange, Client } from 'urql';
import { DataHydrationContextProvider } from './DataHydrationContext';

export const SSRContext = React.createContext<SSRExchange | undefined>(
  undefined
);

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

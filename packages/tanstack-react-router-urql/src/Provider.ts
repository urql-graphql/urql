import * as React from 'react';
import type { SSRExchange, Client } from 'urql';
import { Provider } from 'urql';

export const SSRContext = React.createContext<SSRExchange | undefined>(
  undefined
);

/** Provider for `@urql/tanstack-react-router`.
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
 * } from '@urql/tanstack-react-router';
 *
 * const ssr = ssrExchange();
 * const client = createClient({
 *   url: 'https://trygql.formidable.dev/graphql/basic-pokedex',
 *   exchanges: [cacheExchange, ssr, fetchExchange],
 *   suspense: true,
 * });
 *
 * const router = createRouter ({
 *   routeTree,
 *   Wrap: ({ children }) => <UrqlProvider ssr={ssr} client={urqlClient}>{children}</UrqlProvider>,
 *  });
 * }
 *
 * ```
 */
export function UrqlProvider({
  children,
  ssr,
  client,
}: React.PropsWithChildren<{
  ssr: SSRExchange;
  client: Client;
}>) {
  return React.createElement(
    Provider,
    { value: client },
    React.createElement(SSRContext.Provider, { value: ssr }, children)
  );
}

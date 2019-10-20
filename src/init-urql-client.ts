import {
  createClient,
  dedupExchange,
  cacheExchange,
  fetchExchange,
  ssrExchange,
  Client,
  ClientOptions,
  Exchange,
} from 'urql';
import { SSRData, SSRExchange } from 'urql/dist/types/exchanges/ssr';

import 'isomorphic-unfetch';

let urqlClient: Client | null = null;
let ssrCache: SSRExchange | null = null;

export function initUrqlClient(
  clientOptions: ClientOptions,
  mergeExchanges: (ssrEx: SSRExchange) => Exchange[] = ssrEx => [
    dedupExchange,
    cacheExchange,
    ssrEx,
    fetchExchange,
  ],
  initialState?: SSRData,
): [Client | null, SSRExchange | null] {
  /**
   * Create a new Client for every server-side rendered request.
   * This ensures we reset the state for each rendered page.
   * If there is an exising client instance on the client-side, use it.
   */
  const isServer = typeof window === 'undefined';
  if (isServer || !urqlClient) {
    ssrCache = ssrExchange({ initialState });

    urqlClient = createClient({
      ...clientOptions,
      suspense: isServer,
      exchanges: mergeExchanges(ssrCache),
    });
  }

  // Return both the Client instance and the ssrCache.
  return [urqlClient, ssrCache];
}

import {
  createClient,
  dedupExchange,
  cacheExchange,
  fetchExchange,
  ssrExchange,
  Client,
  Exchange,
} from 'urql';
import 'isomorphic-unfetch';
import { NextUrqlClientOptions, SSRData, SSRExchange } from './types';

let urqlClient: Client | null = null;
let ssrCache: SSRExchange | null = null;

export function initUrqlClient(
  clientOptions: NextUrqlClientOptions,
  mergeExchanges: (ssrEx: SSRExchange) => Exchange[] = ssrEx => [
    dedupExchange,
    cacheExchange,
    ssrEx,
    fetchExchange,
  ],
  initialState?: SSRData
): [Client | null, SSRExchange | null] {
  // Create a new Client for every server-side rendered request.
  // This ensures we reset the state for each rendered page.
  // If there is an exising client instance on the client-side, use it.
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

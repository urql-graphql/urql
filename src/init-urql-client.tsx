import {
  createClient,
  dedupExchange,
  cacheExchange,
  fetchExchange,
  ssrExchange,
  Client,
} from 'urql';
import { SSRData, SSRExchange } from 'urql/dist/types/exchanges/ssr';

import 'isomorphic-unfetch';

let urqlClient: Client | null = null;
let ssrCache: SSRExchange | null = null;

export default function initUrqlClient(
  initialState?: SSRData,
): [Client | null, SSRExchange | null] {
  // Create a new client for every server-side rendered request to reset its state
  // for each rendered page
  // Reuse the client on the client-side however
  const isServer = typeof window === 'undefined';
  if (isServer || !urqlClient) {
    ssrCache = ssrExchange({ initialState });

    urqlClient = createClient({
      url: 'https://api.graph.cool/simple/v1/cixmkt2ul01q00122mksg82pn',
      // Active suspense mode on the server-side
      suspense: isServer,
      exchanges: [dedupExchange, cacheExchange, ssrCache, fetchExchange],
    });
  }

  // Return both the cache and the client
  return [urqlClient, ssrCache];
}

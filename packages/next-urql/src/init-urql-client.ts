import { createClient, Client, ClientOptions } from 'urql';
import 'isomorphic-unfetch';

let urqlClient: Client | null = null;

export function initUrqlClient(clientOptions: ClientOptions): Client | null {
  // Create a new Client for every server-side rendered request.
  // This ensures we reset the state for each rendered page.
  // If there is an exising client instance on the client-side, use it.
  const isServer = typeof window === 'undefined';
  if (isServer || !urqlClient) {
    urqlClient = createClient({
      ...clientOptions,
      suspense: isServer || clientOptions.suspense,
    });
  }

  // Return both the Client instance and the ssrCache.
  return urqlClient;
}

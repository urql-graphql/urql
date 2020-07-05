import { createClient, Client, ClientOptions } from 'urql';
import 'isomorphic-unfetch';

let urqlClient: Client | null = null;

export function resetClient() {
  urqlClient = null;
}

export function initUrqlClient(
  clientOptions: ClientOptions,
  canEnableSuspense: boolean
): Client | null {
  // Create a new Client for every server-side rendered request.
  // This ensures we reset the state for each rendered page.
  // If there is an exising client instance on the client-side, use it.
  const isServer = typeof window === 'undefined';
  if (isServer || !urqlClient) {
    urqlClient = createClient({
      ...clientOptions,
      suspense: canEnableSuspense && (isServer || clientOptions.suspense),
    });
    // Serialize the urqlClient to null on the client-side.
    // This ensures we don't share client and server instances of the urqlClient.
    (urqlClient as any).toJSON = () => null;
  }

  // Return both the Client instance and the ssrCache.
  return urqlClient;
}

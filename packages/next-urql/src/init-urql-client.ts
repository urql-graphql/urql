import { Client, ClientOptions, createClient } from '@urql/core';

let urqlClient: Client | null = null;

/** Resets the `Client` that {@link initUrqlClient} returns.
 *
 * @remarks
 * `resetClient` will force {@link initUrqlClient} to create a new
 * {@link Client}, rather than reusing the same `Client` it already
 * created on the client-side.
 *
 * This may be used to force the cache and any state in the `Client`
 * to be cleared and reset.
 */
export function resetClient() {
  urqlClient = null;
}

/** Creates a {@link Client} the given options.
 *
 * @param clientOptions - {@link ClientOptions} to create the `Client` with.
 * @param canEnableSuspense - Enables React Suspense on the server-side for `react-ssr-prepass`.
 * @returns the created {@link Client}
 *
 * @remarks
 * `initUrqlClient` creates a {@link Client} with the given options,
 * like {@link createClient} does, but reuses the same client when
 * run on the client-side.
 *
 * As long as `canEnableSuspense` is set to `true`, it enables React Suspense
 * mode on the server-side for `react-ssr-prepass`.
 */
export function initUrqlClient(
  clientOptions: ClientOptions,
  canEnableSuspense: boolean
): Client {
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

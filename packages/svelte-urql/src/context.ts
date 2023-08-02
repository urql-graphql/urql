import { setContext, getContext } from 'svelte';
import type { ClientOptions } from '@urql/core';
import { Client } from '@urql/core';

const _contextKey = '$$_urql';

/** Returns a provided {@link Client}.
 *
 * @remarks
 * `getContextClient` returns the {@link Client} that’s previously
 * been provided on Svelte’s context with {@link setContextClient}.
 *
 * This is useful to create a `Client` on Svelte’s context once, and
 * then pass it to all GraphQL store functions without importing it
 * from a singleton export.
 *
 * @throws
 * In development, if `getContextClient` can’t get a {@link Client}
 * from Svelte’s context, an error will be thrown.
 */
export const getContextClient = (): Client => {
  const client = getContext(_contextKey);
  if (process.env.NODE_ENV !== 'production' && !client) {
    throw new Error(
      'No urql Client was found in Svelte context. Did you forget to call setContextClient?'
    );
  }

  return client as Client;
};

/** Provides a {@link Client} to a component’s children.
 *
 * @remarks
 * `setContextClient` updates the Svelte context to provide
 * a {@link Client} to be later retrieved using the
 * {@link getContextClient} function.
 */
export const setContextClient = (client: Client): void => {
  setContext(_contextKey, client);
};

/** Creates a {@link Client} and provides it to a component’s children.
 *
 * @param args - a {@link ClientOptions} object to create a `Client` with.
 * @returns the created {@link Client}.
 *
 * @remarks
 * `initContextClient` is a convenience wrapper around
 * `setContextClient` that accepts {@link ClientOptions},
 * creates a {@link Client} and provides it to be later
 * retrieved using the {@link getContextClient} function.
 */
export const initContextClient = (args: ClientOptions): Client => {
  const client = new Client(args);
  setContextClient(client);
  return client;
};

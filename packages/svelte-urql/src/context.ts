import { setContext, getContext } from 'svelte';
import { Client, ClientOptions } from '@urql/core';

const _contextKey = '$$_urql';

/** Retrieves a Client from Svelte's context */
export const getContextClient = (): Client => {
  const client = getContext(_contextKey);
  if (process.env.NODE_ENV !== 'production' && !client) {
    throw new Error(
      'No urql Client was found in Svelte context. Did you forget to call setContextClient?'
    );
  }

  return client as Client;
};

/** Sets a Client on Svelte's context */
export const setContextClient = (client: Client): void => {
  setContext(_contextKey, client);
};

/** Creates Client and adds it to Svelte's context */
export const initContextClient = (args: ClientOptions): Client => {
  const client = new Client(args);
  setContextClient(client);
  return client;
};

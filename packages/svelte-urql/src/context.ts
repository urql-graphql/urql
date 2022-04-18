import { setContext, getContext } from 'svelte';
import { Client, ClientOptions } from '@urql/core';
const _contextKey = '$$_urql';

/** retrieve your client from svelte context */
export const getContextClient = (): Client => getContext(_contextKey);

/** save your client to svelte context  */
export const setContextClient = (client: Client): void => {
  setContext(_contextKey, client);
};

/** create a client and save it to svelte context */
export const initContextClient = (args: ClientOptions): Client => {
  const client = new Client(args);
  setContextClient(client);
  return client;
};

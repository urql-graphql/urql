import { setContext, getContext } from 'svelte';
import { Client, ClientOptions } from '@urql/core';
const _contextKey = '$$_urql';

/** retrieve your client to svelte context */
export const getClient = (): Client => getContext(_contextKey);

/** save your client to svelte context  */
export const setClient = (client: Client): void => {
  setContext(_contextKey, client);
};

/** create a client and save it to svelte context */
export const initClient = (args: ClientOptions): Client => {
  const client = new Client(args);
  setClient(client);
  return client;
};

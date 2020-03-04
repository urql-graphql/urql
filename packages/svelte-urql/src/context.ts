import { setContext, getContext } from 'svelte';
import { Client, ClientOptions } from '@urql/core';

const CLIENT = '$$_URQL';

export const getClient = (): Client => getContext(CLIENT);

export const setClient = (client: Client): void => {
  setContext(CLIENT, client);
};

export const initClient = (args: ClientOptions): Client => {
  const client = new Client(args);
  setClient(client);
  return client;
};

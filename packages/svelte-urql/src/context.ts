import { setContext, getContext } from 'svelte';
import { Client, ClientOptions } from '@urql/core';
import { _contextKey } from './internal';

export const getClient = (): Client => getContext(_contextKey);

export const setClient = (client: Client): void => {
  setContext(_contextKey, client);
};

export const initClient = (args: ClientOptions): Client => {
  const client = new Client(args);
  setClient(client);
  return client;
};

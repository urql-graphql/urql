import { createClient, ClientOptions, Client  } from 'urql/core';
import { setClient } from './context/setClient';

export const createSvelteClient = (args: ClientOptions): Client => {
  const client = createClient(args)
  setClient(client);
  return client;
}

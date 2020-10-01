import { provide } from 'vue-demi';
import { createClient, ClientOptions } from '@urql/core';

export function useClient(opts: ClientOptions) {
  const client = createClient(opts);
  provide('$urql', client);
  return client;
}

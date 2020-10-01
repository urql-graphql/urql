import { provide } from 'vue';
import { createClient } from '@urql/core';

export function useClient(opts) {
  const client = createClient(opts);
  provide('$urql', client);
  return client;
}

import { inject, provide } from 'vue';
import { Client, ClientOptions } from '@urql/core';

export function provideClient(opts: ClientOptions | Client) {
  const client = opts instanceof Client ? opts : new Client(opts);
  provide('$urql', client);
  return client;
}

export function useClient(): Client {
  const client = inject('$urql') as Client;
  if (process.env.NODE_ENV !== 'production' && !client) {
    throw new Error(
      'No urql Client was provided. Did you forget to call `provideClient` in a parent?'
    );
  }

  return client;
}

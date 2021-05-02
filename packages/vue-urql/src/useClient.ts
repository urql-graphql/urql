import { App, getCurrentInstance, inject, provide } from 'vue';
import { Client, ClientOptions } from '@urql/core';

export function provideClient(opts: ClientOptions | Client) {
  const client = opts instanceof Client ? opts : new Client(opts);
  provide('$urql', client);
  return client;
}

export function install(app: App, opts: ClientOptions | Client) {
  const client = opts instanceof Client ? opts : new Client(opts);
  app.provide('$urql', client);
}

export function useClient(): Client {
  if (process.env.NODE_ENV !== 'production' && !getCurrentInstance()) {
    throw new Error(
      'use* functions may only be called during the `setup()` or other lifecycle hooks.'
    );
  }

  const client = inject('$urql') as Client;
  if (process.env.NODE_ENV !== 'production' && !client) {
    throw new Error(
      'No urql Client was provided. Did you forget to install the plugin or call `provideClient` in a parent?'
    );
  }

  return client;
}

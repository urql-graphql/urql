import { App, getCurrentInstance, inject, provide, Ref, isRef, ref } from 'vue';
import { Client, ClientOptions } from '@urql/core';

const clientsPerInstance = new WeakMap<{}, Ref<Client>>();

export function provideClient(opts: ClientOptions | Client | Ref<Client>) {
  let client: Ref<Client>;
  if (!isRef(opts)) {
    client = ref(opts instanceof Client ? opts : new Client(opts));
  } else {
    client = opts;
  }

  const instance = getCurrentInstance();
  if (instance) {
    clientsPerInstance.set(instance, client);
  }

  provide('$urql', client);
  return client.value;
}

export function install(app: App, opts: ClientOptions | Client | Ref<Client>) {
  let client: Ref<Client>;
  if (!isRef(opts)) {
    client = ref(opts instanceof Client ? opts : new Client(opts));
  } else {
    client = opts;
  }
  app.provide('$urql', client);
}

export function useClient(): Ref<Client> {
  const instance = getCurrentInstance();
  if (process.env.NODE_ENV !== 'production' && !instance) {
    throw new Error(
      'use* functions may only be called during the `setup()` or other lifecycle hooks.'
    );
  }

  let client = inject('$urql') as Ref<Client> | undefined;
  if (!client && instance) {
    client = clientsPerInstance.get(instance);
  }

  if (process.env.NODE_ENV !== 'production' && !client) {
    throw new Error(
      'No urql Client was provided. Did you forget to install the plugin or call `provideClient` in a parent?'
    );
  }

  return client!;
}

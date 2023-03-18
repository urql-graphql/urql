import { App, getCurrentInstance, inject, provide, Ref, isRef, ref } from 'vue';
import { Client, ClientOptions } from '@urql/core';

const clientsPerInstance = new WeakMap<{}, Ref<Client>>();

/** Provides a {@link Client} to a component’s children.
 *
 * @param opts - {@link ClientOptions}, a {@link Client}, or a reactive ref object of a `Client`.
 *
 * @remarks
 * `provideClient` provides a {@link Client} to `@urql/vue`’s GraphQL
 * functions in children components.
 *
 * Hint: GraphQL functions and {@link useClient} will see the
 * provided `Client`, even if `provideClient` has been called
 * in the same component’s `setup` function.
 *
 * @example
 * ```ts
 * import { provideClient } from '@urql/vue';
 * // All of `@urql/core` is also re-exported by `@urql/vue`:
 * import { Client, cacheExchange, fetchExchange } from '@urql/core';
 *
 * export default {
 *   setup() {
 *     provideClient(new Client({
 *       url: 'https://API',
 *       exchanges: [cacheExchange, fetchExchange],
 *     }));
 *   },
 * };
 * ```
 */
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

/** Provides a {@link Client} to a Vue app.
 *
 * @param app - the Vue {@link App}
 * @param opts - {@link ClientOptions}, a {@link Client}, or a reactive ref object of a `Client`.
 *
 * @remarks
 * `install` provides a {@link Client} to `@urql/vue`’s GraphQL
 * functions in a Vue app.
 *
 * @example
 * ```ts
 * import * as urql from '@urql/vue';
 * // All of `@urql/core` is also re-exported by `@urql/vue`:
 * import { cacheExchange, fetchExchange } from '@urql/core';
 *
 * import { createApp } from 'vue';
 * import Root from './App.vue';
 *
 * const app = createApp(Root);
 * app.use(urql, {
 *   url: 'http://localhost:3000/graphql',
 *   exchanges: [cacheExchange, fetchExchange],
 * });
 * ```
 */
export function install(app: App, opts: ClientOptions | Client | Ref<Client>) {
  let client: Ref<Client>;
  if (!isRef(opts)) {
    client = ref(opts instanceof Client ? opts : new Client(opts));
  } else {
    client = opts;
  }
  app.provide('$urql', client);
}

/** Returns a provided reactive ref object of a {@link Client}.
 *
 * @remarks
 * `useClient` may be called in Vue `setup` functions to retrieve a
 * reactive rev object of a {@link Client} that’s previously been
 * provided with {@link provideClient} in the current or a parent’s
 * `setup` function.
 *
 * @throws
 * In development, if `useClient` is called outside of a Vue `setup`
 * function or no {@link Client} was provided, an error will be thrown.
 */
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

import { type App, getCurrentScope, type Ref } from 'vue';
import { inject, provide, isRef, shallowRef } from 'vue';
import type { ClientOptions } from '@urql/core';
import { Client } from '@urql/core';

// WeakMap to store client instances as fallback when client is provided and used in the same component
const clientsPerScope = new WeakMap<{}, Ref<Client>>();

/** Provides a {@link Client} to a component and it’s children.
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
 * <script setup>
 *   import { provideClient } from '@urql/vue';
 *   // All of `@urql/core` is also re-exported by `@urql/vue`:
 *   import { Client, cacheExchange, fetchExchange } from '@urql/core';
 *
 *   provideClient(new Client({
 *     url: 'https://API',
 *     exchanges: [cacheExchange, fetchExchange],
 *   }));
 * </script>
 * ```
 */
export function provideClient(opts: ClientOptions | Client | Ref<Client>) {
  let client: Ref<Client>;
  if (!isRef(opts)) {
    client = shallowRef(opts instanceof Client ? opts : new Client(opts));
  } else {
    client = opts;
  }

  const scope = getCurrentScope();
  if (scope) {
    clientsPerScope.set(scope, client);
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
    client = shallowRef(opts instanceof Client ? opts : new Client(opts));
  } else {
    client = opts;
  }
  app.provide('$urql', client);
}

/** Returns a provided reactive ref object of a {@link Client}.
 *
 * @remarks
 * `useClient` may be called in a reactive context to retrieve a
 * reactive ref object of a {@link Client} that’s previously been
 * provided with {@link provideClient} in the current or a parent’s
 * `setup` function.
 *
 * @throws
 * In development, if `useClient` is called outside of a reactive context
 * or no {@link Client} was provided, an error will be thrown.
 */
export function useClient(): Ref<Client> {
  const scope = getCurrentScope();
  if (process.env.NODE_ENV !== 'production' && !scope) {
    throw new Error(
      'use* function must be called within a reactive context (component setup, composable, or effect scope).'
    );
  }

  let client = inject('$urql') as Ref<Client> | undefined;
  if (!client) {
    client = clientsPerScope.get(scope!);
  }

  if (process.env.NODE_ENV !== 'production' && !client) {
    throw new Error(
      'No urql Client was provided. Did you forget to install the plugin or call `provideClient` in a parent?'
    );
  }

  return client!;
}

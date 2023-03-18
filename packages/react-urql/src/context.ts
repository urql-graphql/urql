import { createContext, useContext } from 'react';
import { Client } from '@urql/core';

const OBJ = {};

/** `urql`'s React Context.
 *
 * @remarks
 * The React Context that `urql`’s {@link Client} will be provided with.
 * You may use the reexported {@link Provider} to provide a `Client` as well.
 */
export const Context: import('react').Context<Client | object> =
  createContext(OBJ);

/** Provider for `urql`'s {@link Client} to GraphQL hooks.
 *
 * @remarks
 * `Provider` accepts a {@link Client} and provides it to all GraphQL hooks,
 * and {@link useClient}.
 *
 * You should make sure to create a {@link Client} and provide it with the
 * `Provider` to parts of your component tree that use GraphQL hooks.
 *
 * @example
 * ```tsx
 * import { Provider } from 'urql';
 * // All of `@urql/core` is also re-exported by `urql`:
 * import { Client, cacheExchange, fetchExchange } from '@urql/core';
 *
 * const client = new Client({
 *   url: 'https://API',
 *   exchanges: [cacheExchange, fetchExchange],
 * });
 *
 * const App = () => (
 *   <Provider value={client}>
 *     <Component />
 *   </Provider>
 * );
 * ```
 */
export const Provider: import('react').Provider<Client | object> =
  Context.Provider;

/** React Consumer component, providing the {@link Client} provided on a parent component.
 * @remarks
 * This is an alias for {@link Context.Consumer}.
 */
export const Consumer: import('react').Consumer<Client | object> =
  Context.Consumer;

Context.displayName = 'UrqlContext';

/** Hook returning a {@link Client} from {@link Context}.
 *
 * @remarks
 * `useClient` is a convenience hook, which accesses `urql`'s {@link Context}
 * and returns the {@link Client} defined on it.
 *
 * This will be the {@link Client} you passed to a {@link Provider}
 * you wrapped your elements containing this hook with.
 *
 * @throws
 * In development, if the component you call `useClient()` in is
 * not wrapped in a {@link Provider}, an error is thrown.
 */
export const useClient = (): Client => {
  const client = useContext(Context);

  if (client === OBJ && process.env.NODE_ENV !== 'production') {
    const error =
      "No client has been specified using urql's Provider. please create a client and add a Provider.";

    console.error(error);
    throw new Error(error);
  }

  return client as Client;
};

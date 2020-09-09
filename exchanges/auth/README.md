<h2 align="center">@urql/exchange-auth</h2>

<p align="center"><strong>An exchange for managing authentication in <code>urql</code></strong></p>

`@urql/exchange-auth` is an exchange for the [`urql`](https://github.com/FormidableLabs/urql) GraphQL client which helps handle auth headers and token refresh

## Quick Start Guide

First install `@urql/exchange-auth` alongside `urql`:

```sh
yarn add @urql/exchange-auth
# or
npm install --save @urql/exchange-auth
```

You'll then need to add the `authExchange`, that this package exposes to your `urql` Client

```js
import { createClient, dedupExchange, cacheExchange, fetchExchange } from 'urql';
import { authExchange } from '@urql/exchange-auth';

const client = createClient({
  url: 'http://localhost:1234/graphql',
  exchanges: [
    dedupExchange,
    cacheExchange,
    authExchange({
      addAuthToOperation: ({
        authState,
        operation,
      }) => {
        // the token isn't in the auth state, return the operation without changes
        if (!authState || !authState.token) {
          return operation;
        }

        // fetchOptions can be a function (See Client API) but you can simplify this based on usage
        const fetchOptions =
          typeof operation.context.fetchOptions === 'function'
            ? operation.context.fetchOptions()
            : operation.context.fetchOptions || {};

        return {
          ...operation,
          context: {
            ...operation.context,
            fetchOptions: {
              ...fetchOptions,
              headers: {
                ...fetchOptions.headers,
                "Authorization": authState.token,
              },
            },
          },
        };
      },
      willAuthError: ({ authState }) => {
        if (!authState) return true;
        // e.g. check for expiration, existence of auth etc
        return false;
      },
      didAuthError: ({ error }) => {
        // check if the error was an auth error (this can be implemented in various ways, e.g. 401 or a special error code)
        return error.graphQLErrors.some(
          e => e.extensions?.code === 'FORBIDDEN',
        );
      },
      getAuth: async ({ authState, mutate }) => {
        // for initial launch, fetch the auth state from storage (local storage, async storage etc)
        if (!authState) {
          const token = localStorage.getItem('token');
          const refreshToken = localStorage.getItem('refreshToken');
          if (token && refreshToken) {
            return { token, refreshToken };
          }
          return null;
        }

        /**
         * the following code gets executed when an auth error has occurred
         * we should refresh the token if possible and return a new auth state
         * If refresh fails, we should log out
         **/

        // if your refresh logic is in graphQL, you must use this mutate function to call it
        // if your refresh logic is a separate RESTful endpoint, use fetch or similar
        const result = await mutate(refreshMutation, {
          token: authState!.refreshToken,
        });

        if (result.data?.refreshLogin) {
          // save the new tokens in storage for next restart
          localStorage.setItem('token', result.data.refreshLogin.token);
          localStorage.setItem('refreshToken', result.data.refreshLogin.refreshToken);

          // return the new tokens
          return {
            token: result.data.refreshLogin.token,
            refreshToken: result.data.refreshLogin.refreshToken,
          };
        }

        // otherwise, if refresh fails, log clear storage and log out
        localStorage.clear();

        // your app logout logic should trigger here
        logout();

        return null;
      },
    }),
    fetchExchange
  ],
});
```

## Handling Errors via the errorExchange

Handling the logout logic in `getAuth` is the easiest way to get started, but it means the errors will always get swallowed by the `authExchange`.
If you want to handle errors globally, this can be done using the `errorExchange`:

```js
import { errorExchange } from 'urql';

// this needs to be placed ABOVE the authExchange in the exchanges array, otherwise the auth error will show up hear before the auth exchange has had the chance to handle it
errorExchange({
  onError: (error) => {
    // we only get an auth error here when the auth exchange had attempted to refresh auth and getting an auth error again for the second time
    const isAuthError = error.graphQLErrors.some(
      e => e.extensions?.code === 'FORBIDDEN',
    );

    if (isAuthError) {
      // clear storage, log the user out etc
    }
  }
}),
```

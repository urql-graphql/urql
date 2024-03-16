<h2 align="center">@urql/exchange-auth</h2>

<p align="center"><strong>An exchange for managing authentication in <code>urql</code></strong></p>

`@urql/exchange-auth` is an exchange for the [`urql`](https://github.com/urql-graphql/urql) GraphQL client which helps handle auth headers and token refresh

## Quick Start Guide

First install `@urql/exchange-auth` alongside `urql`:

```sh
yarn add @urql/exchange-auth
# or
npm install --save @urql/exchange-auth
```

You'll then need to add the `authExchange`, that this package exposes to your `urql` Client

```js
import { createClient, cacheExchange, fetchExchange } from 'urql';
import { makeOperation } from '@urql/core';
import { authExchange } from '@urql/exchange-auth';

const client = createClient({
  url: 'http://localhost:1234/graphql',
  exchanges: [
    cacheExchange,
    authExchange(async utils => {
      // called on initial launch,
      // fetch the auth state from storage (local storage, async storage etc)
      let token = localStorage.getItem('token');
      let refreshToken = localStorage.getItem('refreshToken');

      return {
        addAuthToOperation(operation) {
          if (token) {
            return utils.appendHeaders(operation, {
              Authorization: `Bearer ${token}`,
            });
          }
          return operation;
        },
        willAuthError(_operation) {
          // e.g. check for expiration, existence of auth etc
          return !token;
        },
        didAuthError(error, _operation) {
          // check if the error was an auth error
          // this can be implemented in various ways, e.g. 401 or a special error code
          return error.graphQLErrors.some(e => e.extensions?.code === 'FORBIDDEN');
        },
        async refreshAuth() {
          // called when auth error has occurred
          // we should refresh the token with a GraphQL mutation or a fetch call,
          // depending on what the API supports
          const result = await mutate(refreshMutation, {
            token: authState?.refreshToken,
          });

          if (result.data?.refreshLogin) {
            // save the new tokens in storage for next restart
            token = result.data.refreshLogin.token;
            refreshToken = result.data.refreshLogin.refreshToken;
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);
          } else {
            // otherwise, if refresh fails, log clear storage and log out
            localStorage.clear();
            logout();
          }
        },
      };
    }),
    fetchExchange,
  ],
});
```

## Handling Errors via the errorExchange

Handling the logout logic in `refreshAuth` is the easiest way to get started,
but it means the errors will always get swallowed by the `authExchange`.
If you want to handle errors globally, this can be done using the `mapExchange`:

```js
import { mapExchange } from 'urql';

// this needs to be placed ABOVE the authExchange in the exchanges array, otherwise the auth error
// will show up hear before the auth exchange has had the chance to handle it
mapExchange({
  onError(error) {
    // we only get an auth error here when the auth exchange had attempted to refresh auth and
    // getting an auth error again for the second time
    const isAuthError = error.graphQLErrors.some(
      e => e.extensions?.code === 'FORBIDDEN',
    );
    if (isAuthError) {
      // clear storage, log the user out etc
    }
  }
}),
```

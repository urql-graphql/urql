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

You'll then need to add the `authExchange`, that this package exposes, to your `urql` Client

```js
import { createClient, dedupExchange, cacheExchange } from 'urql';
import { executeExchange } from '@urql/exchange-execute';

const client = createClient({
  url: 'http://localhost:1234/graphql',
  exchanges: [
    dedupExchange,
    cacheExchange,
    authExchange({
      addAuthToOperation: ({ authState, operation }) => {
        const token = authState?.token;
        const authHeader = {
          Authorization: token || "",
        };

        const fetchOptions =
          typeof operation.context.fetchOptions === "function"
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
                ...authHeader,
              },
            },
          },
        };
      },
      willAuthError: ({ operation, authState }) => {
        if (!authState) return true;
        // e.g. check for expiration, existence of auth etc
        return false;
      },
      didAuthError: ({ error, authState }) => {
        // check if the error was an auth error (this can be implemented in various ways, e.g. 401 or a speciall error code)
        return error.graphQLErrors.some(
          e => e.extensions?.code === "FORBIDDEN",
        );
      },
      getAuth: async ({ authState }) => {
        // for initial launch, fetch the auth state from storage (local storage, async storage etx)
        if (!authState) {
          const token = await SInfo.getItem(TOKEN_KEY, {});
          const refreshToken = await SInfo.getItem(REFRESH_TOKEN_KEY, {});
          return { token, refreshToken };
        }

        // otherwise fetch the new auth state async, e.g. from an api using a refresh token
        return { token: "new-token", refreshToken: "new-refresh" };
      },
    }),
    fetchExchange
  ],
});
```

## Maintenance Status

**Active:** Formidable is actively working on this project, and we expect to continue for work for the foreseeable future. Bug reports, feature requests and pull requests are welcome.

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
      getInitialAuthState: () => {
        // fetch your auth state from storage. This can be async
        return { token: 'token', refreshToken: 'refresh-token' };
      },
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
      isAuthError: error =>
          error.graphQLErrors.some(e => e.extensions?.code === "FORBIDDEN"),
      refetchAuth: async ({ authState, attempt }) => {
        if (attempt === 0) {
          // fetch new token if possible
          const newAuthState = { token: 'new-token' };
          return newAuthState;
        }
        // if the auth has already been refreshed and still failing with an auth error, time to log the user out
        logout();
        return null;
      },
    }),
    fetchExchange
  ],
});
```

## Maintenance Status

**Active:** Formidable is actively working on this project, and we expect to continue for work for the foreseeable future. Bug reports, feature requests and pull requests are welcome.

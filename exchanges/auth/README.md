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
      getAuthStateFromStorage: () => {
        // fetch your auth state from storage. This can be async
        return { token: 'token', refreshToken: 'refresh-token' };
      },
      getAuthHeader: ({ authState }) => {
        // use the auth state as constructed above to create an auth header
        const token = authState?.token;
        return {
          Authorization: token ? `Bearer ${token}` : '',
        };
      },
    }),
    fetchExchange
  ],
});
```

## Maintenance Status

**Active:** Formidable is actively working on this project, and we expect to continue for work for the foreseeable future. Bug reports, feature requests and pull requests are welcome.

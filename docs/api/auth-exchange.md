---
title: '@urql/exchange-auth'
order: 10
---

# Authentication Exchange

> **Note:** These API docs are deprecated as we now keep TSDocs in all published packages.
> You can view TSDocs while using these packages in your editor, as long as it supports the
> TypeScript Language Server.
> We're planning to replace these API docs with a separate web app soon.

The `@urql/exchange-auth` package contains an addon `authExchange` for `urql` that aims to make it
easy to implement complex authentication and reauthentication flows as are typically found with JWT
token based API authentication.

## Installation and Setup

First install `@urql/exchange-auth` alongside `urql`:

```sh
yarn add @urql/exchange-auth
# or
npm install --save @urql/exchange-auth
```

You'll then need to add the `authExchange`, that this package exposes to your `Client`. The
`authExchange` is an asynchronous exchange, so it must be placed in front of all `fetchExchange`s
but after all other synchronous exchanges, like the `cacheExchange`.

```js
import { createClient, cacheExchange, fetchExchange } from 'urql';
import { authExchange } from '@urql/exchange-auth';

const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [
    cacheExchange,
    authExchange(async utils => {
      return {
        /* config... */
      };
    }),
    fetchExchange,
  ],
});
```

The `authExchange` accepts an initialization function. This function is called when your exchange
and `Client` first start up, and must return an object of options wrapped in a `Promise`, which is
used to configure how your authentication method works.

You can use this function to first retrieve your authentication state from a kind
of local storage, or to call your API to validate your authentication state first.

The relevant configuration options, returned to the `authExchange`, then determine
how the `authExchange` behaves:

- `addAuthToOperation` must be provided to tell `authExchange` how to add authentication information
  to an operation, e.g. how to add the authentication state to an operation's fetch headers.
- `willAuthError` may be provided to detect expired tokens or tell whether an operation will likely
  fail due to an authentication error.
- `didAuthError` may be provided to let the `authExchange` detect authentication errors from the
  API on results.
- `refreshAuth` is called when an authentication error occurs and gives you an opportunity to update
  your authentication state. Afterwards, the `authExchange` will retry your operation.

[Read more examples in the documentation given here.](../advanced/authentication.md)

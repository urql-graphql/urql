# @urql/exchange-persisted

The `persistedExchange` is an exchange that allows other terminating exchanges to support Persisted Queries, and is as such placed in front of either the default `fetchExchange` or
other terminating exchanges.

## Quick Start Guide

First install `@urql/exchange-persisted` alongside `urql`:

```sh
yarn add @urql/exchange-persisted
# or
npm install --save @urql/exchange-persisted
```

You'll then need to add the `persistedExchange` function, that this package exposes,
to your `exchanges`.

```js
import { createClient, fetchExchange, cacheExchange } from 'urql';
import { persistedExchange } from '@urql/exchange-persisted';

const client = createClient({
  url: 'http://localhost:1234/graphql',
  exchanges: [
    cacheExchange,
    persistedExchange({
      /* optional config */
    }),
    fetchExchange,
  ],
});
```

The `persistedExchange` supports three configuration options:

- `preferGetForPersistedQueries`: Enforce `GET` method to be used by the default `fetchExchange` for persisted queries
- `enforcePersistedQueries`: This disables _automatic persisted queries_ and disables any retry logic for how the API responds to persisted queries. Instead it's assumed that they'll always succeed.
- `generateHash`: A function that takes a GraphQL query and returns the hashed result. This defaults to the `window.crypto` API in the browser and the `crypto` module in Node.
- `enableForMutation`: By default, the exchange only handles `query` operations, but enabling this allows it to handle mutations as well.

## Avoid hashing during runtime

If you want to generate hashes at build-time you can use a [webpack-loader](https://github.com/leoasis/graphql-persisted-document-loader) to achieve this,
when using this all you need to do in this exchange is the following:

```js
import { createClient, fetchExchange, cacheExchange } from 'urql';
import { persistedExchange } from '@urql/exchange-persisted';

const client = createClient({
  url: 'http://localhost:1234/graphql',
  exchanges: [
    cacheExchange,
    persistedExchange({
      generateHash: (_, document) => document.documentId,
    }),
    fetchExchange,
  ],
});
```

# @urql/exchange-persisted-fetch

The `persistedFetchExchange` is an exchange that builds on the regular `fetchExchange`
but adds support for Persisted Queries.

## Quick Start Guide

First install `@urql/exchange-persisted-fetch` alongside `urql`:

```sh
yarn add @urql/exchange-persisted-fetch
# or
npm install --save @urql/exchange-persisted-fetch
```

You'll then need to add the `persistedFetchExchange` method, that this package exposes,
to your `exchanges`.

```js
import { createClient, dedupExchange, fetchExchange, cacheExchange } from 'urql';
import { persistedFetchExchange } from '@urql/exchange-persisted-fetch';

const client = createClient({
  url: 'http://localhost:1234/graphql',
  exchanges: [
    dedupExchange,
    cacheExchange,
    persistedFetchExchange({
      /* optional config */
    }),
    fetchExchange
  ],
});
```

The `persistedQueryExchange` supports two configuration options:

- `preferGetForPersistedQueries`: Use `GET` for fetches with persisted queries
- `generateHash`: A function that takes a GraphQL query and returns the hashed result. This defaults to the `window.crypto` API in the browser and the `crypto` module in node.

The `persistedFetchExchange` only handles queries, so for mutations we keep the
`fetchExchange` around alongside of it.

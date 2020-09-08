---
title: '@urql/exchange-persisted-fetch'
order: 7
---

# Persisted Fetch Exchange

The `@urql/exchange-persisted-fetch` package contains an addon `persistedFetchExchange` for `urql`
that enables the use of _Automatic Persisted Queries_ with `urql`.

It follows the unofficial [GraphQL Persisted Queries
Spec](https://github.com/apollographql/apollo-link-persisted-queries#apollo-engine) which is
supported by the
[Apollo Sever package](https://www.apollographql.com/docs/apollo-server/performance/apq/).

This exchange uses the same fetch logic as the [`fetchExchange`](./core.md#fetchexchange) and the
[`multipartFetchExchange`](./multipart-fetch-exchange.md) by reusing logic from `@urql/core/internal`.
The `persistedFetchExchange` will attempt to send queries with an additional SHA256 hash to the
GraphQL API and will otherwise, when Automatic Persisted Queries are unsupported or when a mutation
or subscription is sent, forward the operation to the next exchange. Hence it should always be added
in front of another [`fetchExchange`](./core.md#fetchexchange).

The `persistedFetchExchange` will use the built-in [Web Crypto
API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) for SHA256 hashing in the
browser, which has been implemented to support IE11 as well. In Node.js it'll use the [Node
Crypto Module](https://nodejs.org/api/crypto.html) instead. It's also possible to use the
`generateHash` option to alter how the SHA256 hash is generated or retrieved.

## Installation and Setup

First install `@urql/exchange-persisted-fetch` alongside `urql`:

```sh
yarn add @urql/exchange-persisted-fetch
# or
npm install --save @urql/exchange-persisted-fetch
```

You'll then need to add the `persistedFetchExchange`, that this package exposes, to your
`exchanges`, in front of the `fetchExchange`. If you're using the
[`multipartFetchExchange`](./multipart-fetch-exchange.md) then it must be added in front of that
instead:

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
    fetchExchange,
  ],
});
```

## Options

| Option                         | Description                                                                                                                                                                                                                                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preferGetForPersistedQueries` | This is similar to [the `Client`'s `preferGetMethod` option](./core.md#client) and will cause all persisted queries to be sent using a GET request.                                                                                                                                                                      |
| `generateHash`                 | This option accepts a function that receives the `query` as a string and the raw `DocumentNode` as a second argument and must return a `Promise<string>` resolving to a SHA256 hash. This can be used to swap out the SHA256 API, e.g. for React Native, or to use pre-generated SHA256 strings from the `DocumentNode`. |

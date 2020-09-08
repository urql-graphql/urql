---
title: '@urql/exchange-request-policy'
order: 8
---

# Request Policy Exchange

The `@urql/exchange-request-policy` package contains an addon `requestPolicyExchange` for `urql`
that may be used to upgrade [Operations' Request Policies](./core.md#requestpolicy) on a
time-to-live basis.

[Read more about request policies on the "Queries" page.](../basics/queries.md#request-policies)

This exchange will conditionally upgrade `cache-first` and `cache-only` operations to use
`cache-and-network`, so that the client gets an opportunity to update its cached data, when the
operation hasn't been seen within the given `ttl` time. This is often preferable to setting the
default policy to `cache-and-network` to avoid an unnecessarily high amount of requests to be sent
to the API when switching pages.

## Installation and Setup

First install `@urql/exchange-request-policy` alongside `urql`:

```sh
yarn add @urql/exchange-request-policy
# or
npm install --save @urql/exchange-request-policy
```

Then add it to your `Client`, preferably after the `dedupExchange` but in front of any asynchronous
exchanges, like the `fetchExchang`:

```js
import { createClient, dedupExchange, cacheExchange, fetchExchange } from 'urql';
import { requestPolicyExchange } from '@urql/exchange-request-policy';

const client = createClient({
  url: '/graphql',
  exchanges: [
    dedupExchange,
    requestPolicyExchange({
      /* config */
    }),
    cacheExchange,
    fetchExchange,
  ],
});
```

## Options

| Option          | Description                                                                                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ttl`           | The "time-to-live" until an `Operation` will be upgraded to the `cache-and-network` policy in milliseconds. By default 5 minutes is set.                                                                                                                      |
| `shouldUpgrade` | An optional function that receives an `Operation` as the only argument and may return `true` or `false` depending on whether an operation should be upgraded. This can be used to filter out operations that should never be upgraded to `cache-and-network`. |

# @urql/exchange-request-policy (Exchange factory)

`@urql/exchange-request-policy` is an exchange for the [`urql`](../../README.md) GraphQL client that will automatically upgrade operation request-policies
on a time-to-live basis.

## Quick Start Guide

First install `@urql/exchange-request-policy` alongside `urql`:

```sh
yarn add @urql/exchange-request-policy
# or
npm install --save @urql/exchange-request-policy
```

Then add it to your client.

```js
import { createClient, dedupExchange, cacheExchange, fetchExchange } from 'urql';
import { requestPolicyExchange } from '@urql/exchange-request-policy';

const client = createClient({
  url: 'http://localhost:1234/graphql',
  exchanges: [
    dedupExchange,
    requestPolicyExchange({
      // The amount of time in ms that has to go by before upgrading, default is 5 minutes.
      ttl: 60 * 1000, // 1 minute.
      // An optional function that allows you to specify whether an operation should be upgraded.
      shouldUpgrade: operation => operation.context.requestPolicy !== 'cache-only',
    }),
    cacheExchange,
    fetchExchange,
  ],
});
```

Now when the exchange sees a `cache-first` operation that hasn't been seen in ttl amount of time it will upgrade
the `requestPolicy` to `cache-and-network`.

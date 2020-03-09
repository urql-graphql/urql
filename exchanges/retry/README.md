# @urql/exchange-retry (Exchange factory)

`@urql/exchange-retry` is an exchange for the [`urql`](../../README.md) GraphQL client that allows operations (queries, mutations, subscriptions) to be retried based on an `options` parameter.

The `retryExchange` is of type `Options => Exchange`.

It periodically retries requests that fail due to network errors. It accepts five optional options:

- `initialDelayMs` - the minimum delay between retries, defaults to 1000
- `maxDelayMs` - the maximum delay that can be applied to an operation, defaults to 15000
- `randomDelay` - whether to apply a random delay to protect against thundering herd, defaults to true
- `maxNumberAttempts` - the maximum number of attempts to retry any given operation, defaults to Infinity
- `retryIf` - optional function to apply to errors to determine whether they should be retried

The `retryExchange` will exponentially increase the delay from `minDelayMs` up to `maxDelayMs` with some random jitter added to avoid the [thundering herd problem](https://en.wikipedia.org/wiki/Thundering_herd_problem).

## Quick Start Guide

First install `@urql/exchange-retry` alongside `urql`:

```sh
yarn add @urql/exchange-retry
# or
npm install --save @urql/exchange-retry
```

You'll then need to add the `retryExchange`, that this package exposes, to your
`urql` Client:

```js
import { createClient, dedupExchange, cacheExchange, fetchExchange } from 'urql';
import { retryExchange } from '@urql/exchange-retry';

const client = createClient({
  url: 'http://localhost:1234/graphql',
  exchanges: [
    dedupExchange,
    cacheExchange,
    fetchExchange,
    retryExchange(options), // Use the retryExchange factory to add a new exchange
  ],
});
```

You'll likely want to place the `retryExchange` after the `fetchExchange` so that retries are only performed _after_ the operation has passed through the cache and has attempted to fetch.

## Usage

After installing `@urql/exchange-retry` and adding it to your `urql` client, `urql` will retry operations based on the options passed to the `retryExchange`.

```js
import React from 'react';
import { useQuery } from 'urql';

const LoadingIndicator = () => <h1>Loading...</h1>;

const YourContent = () => {
  const [{ fetching, data }] = useQuery({ query: allPostsQuery });
  // Unlike a normal query, if the first request resulted in an error,
  // the query will be automatically retried based on the `retryExchange` options
  return !fetching && <div>{data}</div>;
};

return <YourContent />;
```

<!-- TODO?: Add code sandbox demo -->

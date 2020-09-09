---
title: Retrying Operations
order: 5
---

# Retrying Operations

The `retryExchange` lets us retry specific operation, by default it will
retry only network errors but we can specify additional options to add
functionality.

## Installation and Setup

First install `@urql/exchange-retry` alongside `urql`:

```sh
yarn add @urql/exchange-retry
# or
npm install --save @urql/exchange-retry
```

You'll then need to add the `retryExchange`, exposed by this package, to your `urql` Client:

```js
import { createClient, dedupExchange, cacheExchange, fetchExchange } from 'urql';
import { retryExchange } from '@urql/exchange-retry';

// None of these options have to be added, these are the default values.
const options = {
  initialDelayMs: 1000,
  maxDelayMs: 15000,
  randomDelay: true,
  maxNumberAttempts: 2,
  retryIf: err => err && err.networkError,
};

// Note the position of the retryExchange - it should be placed prior to the
// fetchExchange and after the cacheExchange for it to function correctly
const client = createClient({
  url: 'http://localhost:1234/graphql',
  exchanges: [
    dedupExchange,
    cacheExchange,
    retryExchange(options), // Use the retryExchange factory to add a new exchange
    fetchExchange,
  ],
});
```

We want to place the `retryExchange` after the `fetchExchange` so that retries are only performed _after_ the operation has passed through the cache and has attempted to fetch.

## The Options

There are a set of optional options that allow for fine-grained control over the `retry` mechanism.

We have the `initialDelayMs` to specify at what interval the `retrying` should start, this means that if we specify `1000` that when our `operation` fails we'll wait 1 second and then retry it.

Next up is the `maxDelayMs`, our `retryExchange` will keep increasing the time between retries so we don't spam our server with requests it can't complete, this option ensures we don't exceed a certain threshold. This time between requests will increase with a random `back-off` factor multiplied by the `initialDelayMs`, read more about the [thundering herd problem](https://en.wikipedia.org/wiki/Thundering_herd_problem).

Talking about increasing the `delay` randomly, `randomDelay` allows us to disable this. When this option is set to `false` we'll only increase the time between attempts with the `initialDelayMs`. This means if we fail the first time we'll have 1 second wait, next fail we'll have 2 seconds and so on.

We don't want to infinitely attempt an `operation`, we can declare how many times it should attempt the `operation` with `maxNumberAttempts`.

[For more information on the available options check out the API Docs.](../api/retry-exchange.md)

## Reacting to Different Errors

We can introduce specific triggers for the `retryExchange` to start retrying operations,
let's look at an example:

```js
import { createClient, dedupExchange, cacheExchange, fetchExchange } from 'urql';
import { retryExchange } from '@urql/exchange-retry';

const client = createClient({
  url: 'http://localhost:1234/graphql',
  exchanges: [
    dedupExchange,
    cacheExchange,
    retryExchange({
      retryIf: error => {
        if ((error && error.graphQLErrors.length > 0) || error.networkError) {
          return true;
        }
      },
    }),
    fetchExchange,
  ],
});
```

In the above example we'll retry when we have `graphQLErrors` or a `networkError`, we can go
more granular and check for certain errors in `graphQLErrors`.

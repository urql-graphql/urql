# @urql/exchange-refocus

`@urql/exchange-refocus` is an exchange for the [`urql`](../../README.md) GraphQL client that tracks currently active operations and redispatches them when the
window regains focus

## Quick Start Guide

First install `@urql/exchange-refocus` alongside `urql`:

```sh
yarn add @urql/exchange-refocus
# or
npm install --save @urql/exchange-refocus
```

Then add it to your `Client`, preferably after the `dedupExchange` but in front of any asynchronous
exchanges, like the `fetchExchange`:

```js
import { createClient, dedupExchange, cacheExchange, fetchExchange } from 'urql';
import { refocusExchange } from '@urql/exchange-refocus';

const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [dedupExchange, refocusExchange(), cacheExchange, fetchExchange],
});
```

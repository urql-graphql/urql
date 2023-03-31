---
title: '@urql/exchange-refocus'
order: 11
---

# Refocus Exchange

> **Note:** These API docs are deprecated as we now keep TSDocs in all published packages.
> You can view TSDocs while using these packages in your editor, as long as it supports the
> TypeScript Language Server.
> We're planning to replace these API docs with a separate web app soon.

`@urql/exchange-refocus` is an exchange for the `urql` that tracks currently active operations and redispatches them when the
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

<h2 align="center">@urql/exchange-graphcache</h2>

<p align="center"><strong>An exchange for normalized caching support in <code>urql</code></strong></p>

`@urql/exchange-graphcache` is a normalized cache exchange for the [`urql`](https://github.com/urql-graphql/urql) GraphQL client.
This is a drop-in replacement for the default `cacheExchange` that, instead of document
caching, caches normalized data by keys and connections between data.

You can also pass your introspected GraphQL schema to the `cacheExchange`, which enables
it to deliver partial results and match fragments deterministically!

`urql` is already quite a comprehensive GraphQL client. However in several cases it may be
desirable to have data update across the entirety of an app when a response updates some
known pieces of data.

[Learn more about Graphcache and normalized caching on our docs!](https://formidable.com/open-source/urql/docs/graphcache/)

## Quick Start Guide

First install `@urql/exchange-graphcache` alongside `urql`:

```sh
yarn add @urql/exchange-graphcache
# or
npm install --save @urql/exchange-graphcache
```

You'll then need to add the `cacheExchange`, that this package exposes, to your `urql` Client,
by replacing the default cache exchange with it:

```js
import { createClient, fetchExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache';

const client = createClient({
  url: 'http://localhost:1234/graphql',
  exchanges: [
    // Replace the default cacheExchange with the new one
    cacheExchange({
      /* optional config */
    }),
    fetchExchange,
  ],
});
```

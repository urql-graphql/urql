<h2 align="center">@urql/exchange-graphcache</h2>
<p align="center">
<strong>An exchange for normalized caching support in <code>urql</code></strong>
<br /><br />
<a href="https://npmjs.com/package/@urql/exchange-graphcache">
  <img alt="NPM Version" src="https://img.shields.io/npm/v/@urql/exchange-graphcache.svg" />
</a>
<a href="https://bundlephobia.com/result?p=@urql/exchange-graphcache">
  <img alt="Minified gzip size" src="https://img.shields.io/bundlephobia/minzip/@urql/exchange-graphcache.svg?label=gzip%20size" />
</a>
<a href="https://github.com/FormidableLabs/urql-exchange-graphcache#maintenance-status">
  <img alt="Maintenance Status" src="https://img.shields.io/badge/maintenance-active-green.svg" />
</a>
<a href="https://spectrum.chat/urql">
  <img alt="Spectrum badge" src="https://withspectrum.github.io/badge/badge.svg" />
</a>
</p>

`@urql/exchange-graphcache` is a normalized cache exchange for the [`urql`](https://github.com/FormidableLabs/urql) GraphQL client.
This is a drop-in replacement for the default `cacheExchange` that, instead of document
caching, caches normalized data by keys and connections between data.

You can also pass your introspected GraphQL schema to the `cacheExchange`, which enables
it to deliver partial results and match fragments deterministically!

`urql` is already quite a comprehensive GraphQL client. However in several cases it may be
desirable to have data update across the entirety of an app when a response updates some
known pieces of data.

Read more about [normalized-caching](https://formidable.com/open-source/urql/docs/graphcache)

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
import { createClient, dedupExchange, fetchExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache';

const client = createClient({
  url: 'http://localhost:1234/graphql',
  exchanges: [
    dedupExchange,
    // Replace the default cacheExchange with the new one
    cacheExchange({
      /* optional config */
    }),
    fetchExchange,
  ],
});
```

## Features and Roadmap

- [x] Normalized resolving and updates
- [x] Schema awareness and deterministic fragment matching
- [x] Partial query results when the cache is schema aware
- [x] Customization using custom resolvers, updates, and keying functions
- [x] Optimistic updates
- [ ] Basic offline and persistence support
- [ ] Advanced fragment and entity invalidation

## Maintenance Status

**Active:** Formidable is actively working on this project, and we expect to continue for work for the foreseeable future. Bug reports, feature requests and pull requests are welcome.

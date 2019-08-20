<h2 align="center">@urql/exchange-graphcache</h2>
<p align="center">
<strong>An exchange for normalized caching support in <code>urql</code></strong>
<br /><br />
<a href="https://npmjs.com/package/@urql/exchange-graphcache">
  <img alt="NPM Version" src="https://img.shields.io/npm/v/@urql/exchange-graphcache.svg" />
</a>
<a href="https://codecov.io/gh/formidablelabs/urql-exchange-graphcache">
  <img alt="Test Coverage" src="https://codecov.io/gh/formidablelabs/urql-exchange-graphcache/branch/master/graph/badge.svg" />
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

`urql` is already quite a comprehensive GraphQL client. However in several cases it may be
desirable to have data update across the entirety of an app when a response updates some
known pieces of data. This cache also provides configurable APIs to:

- resolve Query data from the offline cache
- update Query data after mutations
- provide optimistic Mutation responses

> ⚠️ Note: `@urql/exchange-graphcache` is still in **beta**. Some features may be
> temporarily unstable and others are not yet done. Please check the **Future Features**
> section for more details and report any bugs or feature requests on
> [Spectrum](https://spectrum.chat/urql).

## Quick Start Guide

First install `@urql/exchange-graphcache` alongside `urql`:

```sh
yarn add @urql/exchange-suspense
# or
npm install --save @urql/exchange-suspense
```

You'll then need to add the `cacheExchange`, that this package exposes, to your `urql` Client,
by replacing the default cache exchange with it:

```js
import {
  createClient,
  dedupExchange,
  fetchExchange,
} from 'urql';

import { cacheExchange } from '@urql/exchange-graphcache;

const client = createClient({
  url: 'http://localhost:1234/graphql',
  exchanges: [
    dedupExchange,
    // Replace the default cacheExchange with the new one
    cacheExchange({ /* config */ }),
    fetchExchange,
  ],
});
```

## Future Features

- [ ] Schema awareness and deterministic fragment matching
- [ ] Basic offline and persistence support
- [ ] Partial query results with `cache-only` and `cache-and-network` policies

Schema awareness is important so that we can offer safe offline results that
are partially cached instead of fully. The schema is also necessary to know
how to match interface or enum fragments correctly. **Currently a heuristic
is in place that matches if all fields of the fragment are present in the cache**

## Usage

You can currently configure:

- `resolvers`: A nested `['__typename'][fieldName]` map to resolve results from cache
- `updates`: A mutation field map to apply side-effect updates to the cache
- `optimistic`: A mutation field map to supply optimistic mutation responses
- `keys`: A `__typename` map of functions to generate keys with

The documentation contains more information on how to set up some of these
confguration options. More documentation is in progress.

- [Getting Started guide](./docs/getting-started.md)
- [Architecture information](./docs/architecture.md)

## API

The `cacheExchange` accepts an object with three optional configuration items.

```typescript
{
  keys?: KeyingConfig;
  resolvers?: ResolverConfig;
  updates?: UpdatesConfig;
  optimistic?: OptimisticMutationConfig;
}
```

## Maintenance Status

**Active:** Formidable is actively working on this project, and we expect to continue for work for the foreseeable future. Bug reports, feature requests and pull requests are welcome.

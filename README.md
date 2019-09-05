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

You can also pass your introspected GraphQL schema to the `cacheExchange`, which enables
it to deliver partial results and match fragments deterministically!

`urql` is already quite a comprehensive GraphQL client. However in several cases it may be
desirable to have data update across the entirety of an app when a response updates some
known pieces of data. This cache also provides configurable APIs to:

- resolve Query data from the offline cache
- update Query data after mutations/subscriptions responses
- provide optimistic Mutation responses

> ⚠️ Note: `@urql/exchange-graphcache` is still in **beta**. Some features may be
> temporarily unstable and others are not yet done. Please check the **Future Features**
> section for more details and report any bugs or feature requests on
> [Spectrum](https://spectrum.chat/urql).

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
      /* config */
    }),
    fetchExchange,
  ],
});
```

## Future Features

- [x] Schema awareness and deterministic fragment matching
- [ ] Basic offline and persistence support
- [x] Partial query results

This cache defaults to **delivering safe results** by marking results as incomplete
when any field is missing, triggering a `network-only` operation (a request), when
it encounters uncached fields.

Furthermore there's one case in caching where only having the `__typename` field
leads to potentially unsafe behaviour: **interfaces**. When the cache encounters a
fragment that tries to get data for an interface, it can't tell whether the
cached type matches the interface. In this case we resort to a heuristic
by default. When all fields of the fragment are on the target type, then the
fragment matches successfully and we log a warning.

Schema awareness has been introduced to the cache to improve this behaviour.
When you pass your API's GraphQL schema to the cache, it becomes able to
deliver **partial results**. When the cache has enough information so that
only **optional fields** in a given query are missing, then it delivers
a partial result from the cached data. Subsequently it still issues a network
request (like with `cache-and-network`) to ensure that all information will
still be delivered eventually.

With a schema the cache can also match fragments that refer to interfaces
**deterministically**, since it can look at the schema to match fragments
against types.

Schema awareness is also an important stepping stone for offline support.
Without partial results it becomes difficult to deliver an offline UI
safely, when just some bits of information are missing.

## Usage

You can currently configure:

- `resolvers`: A nested `['__typename'][fieldName]` map to resolve results from cache
- `updates`: A Mutation/Subscription field map to apply side-effect updates to the cache
- `optimistic`: A mutation field map to supply optimistic mutation responses
- `keys`: A `__typename` map of functions to generate keys with
- `schema`: An introspected GraphQL schema in JSON format. When it's passed the cache will
  deliver partial results and enable deterministic fragment matching.

> Note that you don't need any of these options to get started

### Keys

Keys are used when you need a slight alteration to the value of your identifier or
when the identifier is a non-traditional property.

[Read more](./docs/keys.md)

### Resolvers

Resolvers are needed when you want to do additional resolving, for example do some
custom date formatting.

[Read more](./docs/resolvers.md)

### Updates

The graph cache will automatically handle updates but some things are quite hard to
incorporate. Let's say you delete/add an item, it's hard for us to know you wanted to
delete or where to add an item in a list.

[Read more](./docs/updates.md)

### Optimistic

Here you can configure optimistic responses, this means that we don't wait for the server
to respond but offer the user to instantly replace the data with the variables from the
mutation.

[Read more](./docs/optimistic.md)

### Schema

Our way to see what your backend schema looks like, this offers additional functionality.

[Read more](./docs/schema.md)

## Maintenance Status

**Active:** Formidable is actively working on this project, and we expect to continue for work for the foreseeable future. Bug reports, feature requests and pull requests are welcome.

---
title: Offline Support
order: 7
---

# Offline Support

_Graphcache_ allows you to build an offline-first app with built-in offline and persistence support,
by means of adding a `storage` interface. In combination with its [Schema
Awareness](./schema-awareness.md) support and [Optimistic
Updates](./custom-updates.md#optimistic-updates) this can be used to build an application that
serves cached data entirely from memory when a user's device is offline and still display
optimistically executed mutations.

> **NOTE:** Offline Support is currently experimental! It hasn't been extensively tested yet and
> may not always behave as expected. Please try it out with caution!

## Setup

Everything that's needed to set up offline-support is already packaged in the
`@urql/exchange-graphcache` package.

It's first recommended for us to set up [Schema Awareness](./schema-awareness.md). This adds our
server-side schema information to the cache, which allows it to make decisions on what partial data
complies with the schema. This is useful since the offline cache may often be lacking some data but
may then be used to display the partial data we do have, as long as missing data is actually marked
as optional in the schema.

Furthermore, if we have any mutations that the user doesn't interact with after triggering them (for
instance, "liking a post" would be such an action), we may set up [Optimistic
Updates](./custom-updates.md#optimistic-updates) for these mutations, which allows them to be
reflected in our UI before sending a request to the API.

To actually now set up offline support, we'll swap out the `cacheExchange` with the
`offlineExchange`, that's also exported by `@urql/exchange-graphcache`.

```js
import { createClient, dedupExchange, fetchExchange } from 'urql';
import { offlineExchange } from '@urql/exchange-graphcache';

const cache = offlineExchange({
  schema,
  updates: {
    /* ... */
  },
  optimistic: {
    /* ... */
  },
});

const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [dedupExchange, cache, fetchExchange],
});
```

This activates offline support, however we'll also need to provide the `storage` option to the
`offlineExchange`. The `storage` is an adapter that contains methods for storing cache data in a
persisted storage interface on the user's device.

By default we can use the default storage option that `@urql/exchange-graphcache` comes with. This
default storage uses [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) to
persist the cache's data. We can use this default storage by importing the `makeDefaultStorage`
function from `@urql/exchange-graphcache/default-storage`.

```js
import { createClient, dedupExchange, fetchExchange } from 'urql';
import { offlineExchange } from '@urql/exchange-graphcache';
import { makeDefaultStorage } from '@urql/exchange-graphcache/default-storage';

const storage = makeDefaultStorage({
  idbName: 'graphcache-v3', // The name of the IndexedDB database
  maxAge: 7, // The maximum age of the persisted data in days
});

const cache = offlineExchange({
  schema,
  storage,
  updates: {
    /* ... */
  },
  optimistic: {
    /* ... */
  },
});

const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [dedupExchange, cache, fetchExchange],
});
```

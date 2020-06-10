---
title: Offline Support
order: 6
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

We initially recommend setting up the [Schema Awareness](./schema-awareness.md). This adds our
server-side schema information to the cache, which allows it to make decisions on what partial data
complies with the schema. This is useful since the offline cache may often be lacking some data but
may then be used to display the partial data we do have, as long as missing data is actually marked
as optional in the schema.

Furthermore, if we have any mutations that the user doesn't interact with after triggering them (for
instance, "liking a post"), we can set up [Optimistic
Updates](./custom-updates.md#optimistic-updates) for these mutations, which allows them to be
reflected in our UI before sending a request to the API.

To actually now set up offline support, we'll swap out the `cacheExchange` with the
`offlineExchange` that's also exported by `@urql/exchange-graphcache`.

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

## Offline Behavior

_Graphcache_ applies several mechanisms that improve the consistency of the cache and how it behaves
when it's used in highly cached-dependent scenarios, including when it's used with its offline
support. We've previously read about some of these guarantees on the ["Under the hood"
page.](./underunder-the-hood.md)

While the client is offline, _Graphcache_ will also apply some opinionated mechanisms to queries and
mutations.

When a query fails with a Network Error, which indicates that the client is
offline — either because `navigator.onLine` is `false` or because the error message indicates an
offline error — the `offlineExchange` won't deliver the error for this query to avoid it from being
surfaced to the user. This works particularly well in combination with ["Schema
Awareness"](./schema-awareness.md) which will deliver as much of a partial query result as possible.
In combination with the [`cache-and-network` request policy](../basics/queries.md#request-policies)
we can now ensure that we display as much data as possible when the user is offline while still
keeping the cache up-to-date when the user is online.

A similar mechanism is applied to optimistic mutations when the user is offline. Normal
non-optimistic mutations are executed as usual and may fail with a network error. Optimistic
mutations however will be queued up and may be retried when the app is restarted or when the user
comes back online.

## Custom Storages

In the [Setup section](#setup) we've learned how to use the default storage engine to store
persisted cache data in IndexedDB. You can also write custom storage engines, if the default one
doesn't align with your expectations or requirements.
One limitation of our default storage engine is for instance that data is stored time limited with a
maximum age, which prevents the database from becoming too full, but a custom storage engine may
have different strategies for dealing with this.

[The API docs list the entire interface for the `storage` option.](../api/graphcache.md#storage-option)
There we can see which methods we need to implement to implement a custom storage engine.

Following is an example of the simplest possible storage engine, which uses the browser's
[Local Storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).
Initially we'll implement the basic persistence methods, `readData` and `writeData`.

```js
const makeLocalStorage = () => {
  const cache = {};

  return {
    writeData(delta) {
      return Promise.resolve().then(() => {
        Object.assign(cache, delta);
        localStorage.setItem('data', JSON.stringify(cache));
      });
    },
    readData() {
      return Promise.resolve().then(() => {
        const local = localStorage.getItem('data') || null;
        Object.assign(cache, JSON.parse(local));
        return cache;
      });
    },
  };
};
```

As we can see, the `writeData` method only sends us "deltas", partial objects that only describe
updated cache data rather than all cache data. The implementation of `writeMetadata` and
`readMetadata` will however be even simpler, since it always sends us complete data.

```js
const makeLocalStorage = () => {
  return {
    /* ... */
    writeMetadata(data) {
      localStorage.setItem('metadata', JSON.stringify(data));
    },
    readMetadata() {
      return Promise.resolve().then(() => {
        const metadataJson = localStorage.getItem('metadata') || null;
        return JSON.parse(metadataJson);
      });
    },
  };
};
```

Lastly, the `onOnline` method will likely always look the same, as long as your `storage` is
intended to work for browsers only:

```js
const makeLocalStorage = () => {
  return {
    /* ... */
    onOnline(cb: () => void) {
      window.addEventListener('online', () => {
        cb();
      });
    },
  };
};
```

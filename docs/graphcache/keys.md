---
title: Keys
order: 2
---

# Keys

In the last chapter we saw that we always try to create a key with `__typename` and
`id` or `_id`. `__typename` always has to be present but `id` or `_id` can be left out,
graphcache will warn you for this.

The custom `keys` property comes into play for this, when we don't have an `id` or `_id`
we'll be asked to provide a way to create a key for said entity.

Let's look at an example. Say we have a set of todos each with a `__typename`
of `Todo`, but instead of identifying on `id` or `_id` we want to identify
each record by its `name`.

```js
import { cacheExchange } from '@urql/exchange-graphcache'; 

const myGraphCache = cacheExchange({
  keys: {
    Todo: data => data.name,
  },
});
```

Now when we query or write a Todo it will use `name` to identify the record
in the cache. All other records will be resolved the traditional way.

In the same way, you could say that a Todo meant only for admin access is
prefixed with `admin`.

```js
const myGraphCache = cacheExchange({
  keys: {
    Todo: data => (data.isAdminOnly ? `admin-${data.name}` : data.name),
  },
});
```

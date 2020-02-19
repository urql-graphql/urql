---
title: keys
order: 3
---

# Keys

When resolving entities the graph cache will try to look at the entity
and use `id` or `_id` to identify them.

The `keys` property allows us to intervene in this behavior by pointing
to another location on the entity or by pre-/post-fixing it.

Let's look at an example. Say we have a set of todos each with a `__typename`
of `Todo`, but instead of identifying on `id` or `_id` we want to identify
each record by its `name`.

```js
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

[Back](../README.md)

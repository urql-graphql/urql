---
title: Normalized Caching
order: 1
---

# Normalized Caching

In urql we have the option to utilize a normalized caching mechanism,
this opens up a world of new features ranging from automatic updates
to offline capabilities.

Instead of storing a query by its `operationKey` we'll store the entities
we get back and normalize them so for instance:

```js
todo: {
  __typename: 'Todo',
  id: 1,
  title: 'implement graphcache',
  author: {
    __typename: 'Author',
    id: 1,
    name: 'urql-team',
  }
}
```

will become

```js
{
  "Todo:1.title": 'implement graphcache',
  "Todo:1.author": 1,
  "Author:1.name": 'urql-team',
}
```

This allows us to for instance take the result of an update mutation to
`Todo:1` and automatcally update altered properties, this also allows us to
reuse entities. We will always try to create a key with the `__typename` and the
`id` or `_id` whichever is present.

The custom `keys` property comes into play when we don't have an `id` or `_id`,
in this scenario graphcache will warn us and ask to create a key for said entity.

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

### Reading on

[On the next page we'll learn about "Computed queries".](./computed-queries.md)

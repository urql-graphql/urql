---
'@urql/exchange-graphcache': minor
---

Add the possibility of invalidating an entity through the cache instance, this allows you to remove entities from the cache. For example `cache.invalidateEntity({ __typename: 'Todo', id: 1 })`, next time we query the todos we know it will need refetching unless your schema dictates this as an optional listItem
